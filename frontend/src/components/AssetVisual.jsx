import { useId } from "react";

export function AssetVisual({
  type,
  imageKey,
  name = "Equipment",
  className = "",
  size,
}) {
  const id = useId().replaceAll(":", "");
  const key = `${type || imageKey || ""} ${name}`.toLowerCase();
  const screen = `screen-${id}`;
  let product;

  if (/monitor|display|dell.*u27/.test(key)) {
    product = (
      <>
        <rect x="31" y="20" width="118" height="79" rx="5" fill="#27332f" />
        <rect
          x="36"
          y="25"
          width="108"
          height="67"
          rx="2"
          fill={`url(#${screen})`}
        />
        <circle cx="90" cy="96" r="1" fill="#88968d" />
        <path d="M85 100h10l4 18H81z" fill="#abb0a9" />
        <path d="M67 120h46l6 3H61z" fill="#bcc0b8" />
      </>
    );
  } else if (/headphone|audio/.test(key)) {
    product = (
      <>
        <path
          d="M51 76V61a39 39 0 0 1 78 0v15"
          fill="none"
          stroke="#3b4841"
          strokeWidth="13"
        />
        <path
          d="M51 76V61a39 39 0 0 1 78 0v15"
          fill="none"
          stroke="#6a776f"
          strokeWidth="5"
        />
        <rect x="41" y="65" width="25" height="47" rx="12" fill="#28392f" />
        <rect x="114" y="65" width="25" height="47" rx="12" fill="#28392f" />
        <rect x="47" y="71" width="10" height="35" rx="5" fill="#596a5f" />
        <rect x="123" y="71" width="10" height="35" rx="5" fill="#596a5f" />
      </>
    );
  } else if (/phone|mobile|iphone/.test(key)) {
    product = (
      <>
        <rect x="60" y="13" width="60" height="115" rx="11" fill="#2c3832" />
        <rect
          x="64"
          y="17"
          width="52"
          height="107"
          rx="8"
          fill={`url(#${screen})`}
        />
        <rect x="78" y="21" width="24" height="6" rx="3" fill="#1e2924" />
        <rect
          x="79"
          y="117"
          width="22"
          height="2"
          rx="1"
          fill="#e4e7de"
          opacity=".8"
        />
      </>
    );
  } else if (/tablet|ipad/.test(key)) {
    product = (
      <>
        <rect x="47" y="12" width="86" height="115" rx="9" fill="#303b36" />
        <rect
          x="52"
          y="18"
          width="76"
          height="102"
          rx="4"
          fill={`url(#${screen})`}
        />
        <circle cx="90" cy="15" r="1" fill="#a4b5a7" />
        <path
          d="M143 37v76"
          stroke="#b4b6ad"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </>
    );
  } else if (/mouse|accessor|logitech/.test(key)) {
    product = (
      <>
        <path d="M64 50c3-20 44-27 53-3l6 47c2 27-62 33-64 6z" fill="#35423a" />
        <path
          d="M89 33v33M62 68c16-10 37-9 57-2"
          fill="none"
          stroke="#17251e"
          strokeWidth="2"
        />
        <rect x="85" y="40" width="7" height="18" rx="3.5" fill="#a0a99e" />
        <path
          d="M63 80l-2 19c6 15 26 17 32 16"
          fill="none"
          stroke="#65736a"
          strokeWidth="4"
        />
      </>
    );
  } else if (/camera/.test(key)) {
    product = (
      <>
        <path d="M41 51h24l9-13h33l9 13h25v56H41z" fill="#344239" />
        <rect x="120" y="56" width="12" height="6" rx="2" fill="#b2c1b1" />
        <circle cx="91" cy="81" r="29" fill="#1d2823" />
        <circle cx="91" cy="81" r="23" fill="#65776b" />
        <circle cx="91" cy="81" r="18" fill={`url(#${screen})`} />
      </>
    );
  } else {
    product = (
      <>
        <rect x="36" y="19" width="108" height="75" rx="5" fill="#2e3834" />
        <rect
          x="40"
          y="23"
          width="100"
          height="65"
          rx="2"
          fill={`url(#${screen})`}
        />
        <path
          d="M36 94h108l20 18H16z"
          fill="#b7bbb3"
          stroke="#929b91"
          strokeWidth="1"
        />
        <path d="M43 96h94l9 10H33z" fill="#58645b" />
        <g stroke="#a3ada2" strokeWidth="1" opacity=".9">
          <path d="M40 99h100M36 102h108M52 96l-4 10M66 96l-2 10M80 96v10M95 96v10M110 96l2 10M124 96l4 10" />
        </g>
        <path d="M77 107h27l3 4H74z" fill="#98a095" />
        <path d="M16 112h148l-7 4H23z" fill="#8b978b" />
      </>
    );
  }

  return (
    <svg
      viewBox="0 0 180 140"
      width={size || "100%"}
      className={`asset-visual ${className}`}
      role="img"
      aria-label={`Illustration of ${name}`}
    >
      <defs>
        <linearGradient id={screen} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#182b28" />
          <stop offset=".44" stopColor="#657f72" />
          <stop offset=".45" stopColor="#859486" />
          <stop offset=".67" stopColor="#bdc5a7" />
          <stop offset="1" stopColor="#4c6e5e" />
        </linearGradient>
      </defs>
      <ellipse
        cx="90"
        cy="127"
        rx="57"
        ry="4"
        fill="currentColor"
        opacity=".07"
      />
      {product}
    </svg>
  );
}

export default AssetVisual;
