/**
 * ASSET CONTROLLER
 * 
 * This controller handles all asset-related operations (CRUD):
 * - GET /api/assets - List all assets for the user's organization
 * - POST /api/assets - Create a new asset
 * - PATCH /api/assets/:id - Update an existing asset
 * - DELETE /api/assets/:id - Delete an asset
 * 
 * IMPORTANT: All routes are protected by authentication middleware,
 * so req.user.orgId is guaranteed to exist and be valid.
 */

// Import the Prisma client singleton
const prisma = require('../db/prisma');

/**
 * GET ALL ASSETS
 * 
 * Handler for GET /api/assets
 * 
 * Multi-tenant security:
 * - Only returns assets belonging to the user's organization
 * - Uses req.user.orgId from authentication middleware
 * - This prevents users from seeing other organizations' assets
 * 
 * @param {Object} req - Contains req.user.orgId (set by auth middleware)
 * @param {Object} res - Response object
 */
const getAssets = async (req, res) => {
  try {
    /**
     * DATABASE QUERY
     * 
     * findMany() returns multiple records matching the condition.
     * 
     * where: { organizationId: req.user.orgId }
     * - Filters assets to only those belonging to the user's organization
     * - This is CRITICAL for multi-tenant security!
     * 
     * include: { category: true }
     * - Also fetches the related category data for each asset
     * - This is a "join" operation - combines data from Asset and Category tables
     * 
     * Note: No orderBy specified - assets will be returned in database order.
     * If you want to sort by creation date, you need to add a createdAt field
     * to the Asset model in schema.prisma and create a migration.
     */
    const assets = await prisma.asset.findMany({
      where: { organizationId: req.user.orgId },
      include: { category: true }
    });

    // Send the assets array as JSON response
    res.json(assets);
  } catch (error) {
    console.error("Get assets error:", error);
    res.status(500).json({ error: "Failed to fetch assets" });
  }
};

/**
 * CREATE NEW ASSET
 * 
 * Handler for POST /api/assets
 * 
 * Flow:
 * 1. Validate input data
 * 2. Check for duplicate serial numbers
 * 3. Get or create a default category
 * 4. Create the asset in database
 * 5. Return the created asset
 * 
 * @param {Object} req - Contains req.body (asset data) and req.user.orgId
 * @param {Object} res - Response object
 */
const createAsset = async (req, res) => {
  /**
   * EXTRACT DATA FROM REQUEST
   * 
   * Destructuring assignment extracts values from req.body
   * Example: { name: "Laptop", serialNumber: "SN123", status: "active" }
   */
  const { name, serialNumber, status } = req.body;

  // Get organization ID from authenticated user (set by auth middleware)
  const orgId = req.user.orgId;

  /**
   * INPUT VALIDATION - LAYER 1: Required Fields
   * 
   * Always validate user input before using it!
   * Prevents errors and security issues.
   */
  if (!name || !serialNumber) {
    return res.status(400).json({ error: "Name and serial number are required" });
  }

  /**
   * INPUT VALIDATION - LAYER 2: Non-empty Strings
   * 
   * trim() removes whitespace from start/end of string
   * This prevents users from submitting "   " (just spaces) as valid input
   * 
   * Example:
   * "  " -> trim() -> "" -> length === 0 -> INVALID
   * " Laptop " -> trim() -> "Laptop" -> length > 0 -> VALID
   */
  if (name.trim().length === 0 || serialNumber.trim().length === 0) {
    return res.status(400).json({ error: "Name and serial number cannot be empty" });
  }

  /**
   * INPUT VALIDATION - LAYER 3: Status Enum
   * 
   * Only allow specific status values (enum validation)
   * This prevents invalid data from entering the database
   * 
   * validStatuses is an array of allowed values
   * includes() checks if status is in that array
   */
  const validStatuses = ['active', 'maintenance', 'retired'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    /**
     * CHECK FOR DUPLICATE SERIAL NUMBER
     * 
     * Serial numbers should be unique (enforced by database schema)
     * We check before creating to give a better error message
     * 
     * findUnique() finds one record with matching serialNumber
     * If found, existingAsset will be the asset object
     * If not found, existingAsset will be null
     */
    const existingAsset = await prisma.asset.findUnique({
      where: { serialNumber }
    });

    /**
     * SECURITY CHECK: Verify duplicate is in same organization
     * 
     * Even if serial number exists, we only care if it's in OUR organization
     * Different organizations can have same serial numbers (multi-tenant)
     */
    if (existingAsset && existingAsset.organizationId === orgId) {
      // 409 = Conflict (resource already exists)
      return res.status(409).json({ error: "Serial number already exists" });
    }

    /**
     * GET OR CREATE DEFAULT CATEGORY
     * 
     * Assets require a category. If organization has no categories yet,
     * we create a default "General" category.
     * 
     * findFirst() returns the first matching record (or null)
     * If no category exists, we create one
     */
    let category = await prisma.category.findFirst({ where: { organizationId: orgId } });
    if (!category) {
      category = await prisma.category.create({
        data: { name: 'General', organizationId: orgId }
      });
    }

    /**
     * CREATE THE ASSET
     * 
     * prisma.asset.create() inserts a new record into the database
     * 
     * data: { ... } - The data to insert
     * - name.trim() - Remove whitespace before storing
     * - status || 'active' - Use provided status, or default to 'active'
     * - organizationId - Ensures asset belongs to correct organization
     * - categoryId - Links asset to a category
     * 
     * Returns the created asset object (with generated ID, timestamps, etc.)
     */
    const newAsset = await prisma.asset.create({
      data: {
        name: name.trim(),
        serialNumber: serialNumber.trim(),
        status: status || 'active',
        organizationId: orgId,
        categoryId: category.id
      }
    });

    // 201 = Created (successfully created new resource)
    res.status(201).json(newAsset);
  } catch (error) {
    console.error("Prisma Error:", error);

    /**
     * HANDLE PRISMA UNIQUE CONSTRAINT ERROR
     * 
     * Prisma error code P2002 = unique constraint violation
     * This happens if serial number is duplicate (even after our check)
     * Could happen in race condition (two requests at same time)
     */
    if (error.code === 'P2002') {
      return res.status(409).json({ error: "Serial number already exists" });
    }

    // Generic error for any other database errors
    res.status(500).json({ error: "Failed to create asset" });
  }
};

/**
 * DELETE ASSET
 * 
 * Handler for DELETE /api/assets/:id
 * 
 * CRITICAL SECURITY: Multi-tenant protection
 * - Only deletes assets belonging to the user's organization
 * - Uses deleteMany() with BOTH id AND organizationId
 * - This prevents users from deleting other organizations' assets
 * 
 * Why deleteMany() instead of delete()?
 * - delete() throws error if record doesn't exist
 * - deleteMany() returns count of deleted records (0 if none)
 * - We can check count to see if deletion succeeded
 * 
 * @param {Object} req - Contains req.params.id (from URL) and req.user.orgId
 * @param {Object} res - Response object
 */
const deleteAsset = async (req, res) => {
  /**
   * EXTRACT ID FROM URL PARAMETERS
   * 
   * Route is: DELETE /api/assets/:id
   * If URL is: /api/assets/123-abc-456
   * Then req.params.id = "123-abc-456"
   * 
   * Route parameters are defined in server.js with :id
   */
  const { id } = req.params;

  // Get organization ID from authenticated user
  const orgId = req.user.orgId;

  /**
   * INPUT VALIDATION
   * 
   * Ensure ID was provided in the URL
   */
  if (!id) {
    return res.status(400).json({ error: "Asset ID is required" });
  }

  try {
    /**
     * SECURE DELETE OPERATION
     * 
     * deleteMany() deletes all records matching the where condition
     * 
     * CRITICAL: We include organizationId in the where clause!
     * This ensures:
     * 1. Asset exists with that ID
     * 2. Asset belongs to user's organization
     * 
     * If someone tries to delete asset from another organization:
     * - The where clause won't match (different orgId)
     * - deleted.count will be 0
     * - We return 404 (not found) - don't reveal it exists but belongs to another org
     * 
     * This is a security best practice for multi-tenant applications!
     */
    const deleted = await prisma.asset.deleteMany({
      where: {
        id: id,
        organizationId: orgId  // SECURITY: Only delete from user's organization
      }
    });

    /**
     * CHECK IF DELETION SUCCEEDED
     * 
     * deleted.count tells us how many records were deleted
     * - 0 = No matching record (doesn't exist or wrong organization)
     * - 1 = Successfully deleted
     * 
     * We return 404 (Not Found) if count is 0
     * This gives a generic error without revealing security details
     */
    if (deleted.count === 0) {
      return res.status(404).json({ error: "Asset not found or unauthorized" });
    }

    // Success - asset was deleted
    res.json({ message: "Asset deleted successfully" });
  } catch (error) {
    console.error("Delete asset error:", error);
    res.status(500).json({ error: "Failed to delete asset" });
  }
};

/**
 * UPDATE ASSET
 * 
 * Handler for PATCH /api/assets/:id
 * 
 * CRITICAL SECURITY: Multi-tenant protection
 * - Only updates assets belonging to the user's organization
 * - Uses updateMany() with BOTH id AND organizationId
 * - This prevents users from updating other organizations' assets
 * 
 * Why updateMany() instead of update()?
 * - update() throws error if record doesn't exist
 * - updateMany() returns count of updated records (0 if none)
 * - We can check count to see if update succeeded
 * 
 * @param {Object} req - Contains req.params.id (from URL), req.body (update data), and req.user.orgId
 * @param {Object} res - Response object
 */
const updateAsset = async (req, res) => {
  /**
   * EXTRACT DATA FROM REQUEST
   * 
   * - id: From URL parameters (req.params.id)
   * - Update data: From request body (req.body)
   * - orgId: From authenticated user (req.user.orgId)
   */
  const { id } = req.params;
  const { name, serialNumber, status } = req.body;
  const orgId = req.user.orgId;

  /**
   * INPUT VALIDATION
   * 
   * Ensure ID was provided in the URL
   */
  if (!id) {
    return res.status(400).json({ error: "Asset ID is required" });
  }

  /**
   * INPUT VALIDATION - LAYER 1: At least one field to update
   * 
   * User must provide at least one field to update.
   * If all fields are missing, there's nothing to update.
   */
  if (!name && !serialNumber && !status) {
    return res.status(400).json({ error: "At least one field (name, serialNumber, or status) is required" });
  }

  /**
   * INPUT VALIDATION - LAYER 2: Non-empty strings (if provided)
   * 
   * If name or serialNumber are provided, they must not be empty.
   * trim() removes whitespace to prevent "   " as valid input.
   */
  if (name && name.trim().length === 0) {
    return res.status(400).json({ error: "Name cannot be empty" });
  }

  if (serialNumber && serialNumber.trim().length === 0) {
    return res.status(400).json({ error: "Serial number cannot be empty" });
  }

  /**
   * INPUT VALIDATION - LAYER 3: Status Enum (if provided)
   * 
   * If status is provided, it must be one of the valid values.
   */
  const validStatuses = ['active', 'maintenance', 'retired'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    // Correction Policy: Allow serial number edits, but check for duplicates in same org
    if (serialNumber) {
      const existingAsset = await prisma.asset.findUnique({
        where: { serialNumber }
      });

      // Reject if serial number exists in same org and it's a different asset
      if (existingAsset && existingAsset.organizationId === orgId && existingAsset.id !== id) {
        return res.status(409).json({ error: "Serial number already exists" });
      }
    }

    /**
     * BUILD UPDATE DATA OBJECT
     * 
     * Only include fields that were provided in the request.
     * This allows partial updates (PATCH semantics).
     * 
     * Example: If only status is provided, only status gets updated.
     */
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (serialNumber) updateData.serialNumber = serialNumber.trim();
    if (status) updateData.status = status;

    /**
     * SECURE UPDATE OPERATION
     * 
     * updateMany() updates all records matching the where condition.
     * 
     * CRITICAL: We include organizationId in the where clause!
     * This ensures:
     * 1. Asset exists with that ID
     * 2. Asset belongs to user's organization
     * 
     * If someone tries to update asset from another organization:
     * - The where clause won't match (different orgId)
     * - updated.count will be 0
     * - We return 404 (not found) - don't reveal it exists but belongs to another org
     * 
     * This is a security best practice for multi-tenant applications!
     */
    const updated = await prisma.asset.updateMany({
      where: {
        id: id,
        organizationId: orgId  // SECURITY: Only update assets from user's organization
      },
      data: updateData
    });

    /**
     * CHECK IF UPDATE SUCCEEDED
     * 
     * updated.count tells us how many records were updated
     * - 0 = No matching record (doesn't exist or wrong organization)
     * - 1 = Successfully updated
     * 
     * We return 404 (Not Found) if count is 0
     * This gives a generic error without revealing security details
     */
    if (updated.count === 0) {
      return res.status(404).json({ error: "Asset not found or unauthorized" });
    }

    /**
     * FETCH UPDATED ASSET
     * 
     * After successful update, fetch the updated asset to return to client.
     * This ensures client gets the latest data including any database defaults.
     */
    const updatedAsset = await prisma.asset.findUnique({
      where: { id },
      include: { category: true }
    });

    // Success - return the updated asset
    res.json(updatedAsset);
  } catch (error) {
    console.error("Update asset error:", error);

    /**
     * HANDLE PRISMA UNIQUE CONSTRAINT ERROR
     * 
     * Prisma error code P2002 = unique constraint violation
     * This happens if serial number is duplicate (even after our check)
     * Could happen in race condition (two requests at same time)
     */
    if (error.code === 'P2002') {
      return res.status(409).json({ error: "Serial number already exists" });
    }

    // Generic error for any other database errors
    res.status(500).json({ error: "Failed to update asset" });
  }
};

// Export all controller functions so server.js can use them
module.exports = { getAssets, createAsset, deleteAsset, updateAsset };
