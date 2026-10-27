/*
 * An external link whose accessible name says where it goes and that it opens
 * a new tab.
 *
 * Named with aria-label rather than a visually-hidden span: the accessible
 * name algorithm joins child text without a separator, so "Documentation"
 * plus a hidden " for BioTSR" was announced as "Documentationfor BioTSR" (the
 * same trap CodeBlock documents). The label begins with the visible text, so
 * a speech-input user can still say what they see.
 */
export default function ExternalLink({ href, label, context, onClick, className }) {
  const name = [label, context, '(opens in a new tab)'].filter(Boolean).join(' ')
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={className}
      aria-label={name}
    >
      {label}
    </a>
  )
}
