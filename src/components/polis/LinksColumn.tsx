const linkClassName =
  "text-[color:var(--polis-color-primary)] transition-colors duration-200 ease-out hover:text-[color:var(--polis-color-muted)]";

const links = [
  { nodeId: "88:220", name: "X", href: "https://x.com" },
  { nodeId: "88:221", name: "GitHub", href: "https://github.com" },
  { nodeId: "88:228", name: "Polis, Works", href: "https://polis.works" },
  { nodeId: "88:229", name: "Mail", href: "mailto:hello@polis.works" },
  { nodeId: "88:230", name: "Archived lab", href: "#" },
  { nodeId: "88:231", name: "Everyday run", href: "#" },
  { nodeId: "88:232", name: "Monthly playlists", href: "#" },
] as const;

export function LinksColumn() {
  return (
    <div
      className="flex flex-col items-start"
      data-node-id="88:217"
      data-name="div"
      data-animate="entrance"
    >
      <div
        className="flex flex-col items-start w-full text-[length:var(--polis-font-size)] leading-[var(--polis-line-height)] tracking-[var(--polis-letter-spacing)] font-normal"
        data-node-id="88:218"
        data-name="div"
      >
        <p
          className="text-[color:var(--polis-color-muted)]"
          data-node-id="88:219"
          data-name="Links"
        >
          Links
        </p>
        {links.map((link) => (
          <a
            key={link.nodeId}
            href={link.href}
            className={linkClassName}
            data-node-id={link.nodeId}
            data-name={link.name}
          >
            {link.name}
          </a>
        ))}
      </div>
    </div>
  );
}
