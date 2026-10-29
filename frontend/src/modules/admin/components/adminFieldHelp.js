// Only explain non-obvious formats and consequential choices. Native validation
// remains authoritative; basic controls do not need a paragraph of instructions.
const clean = value => String(value ?? '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

export function adminFieldHelp(label, props = {}) {
  const name = clean(label);
  if (props.type === 'file') return props.accept ? `Allowed files: ${props.accept}. Files must pass scanning before use.` : 'Files must pass format, size and scanning checks before use.';
  if (/minor units|price minor|amount minor|amount.*paise/.test(name)) return 'Enter paise: 100 paise = INR 1. Use the approved amount.';
  if (/^(book )?(original )?price(?: \(.*)?$/.test(name)) return 'Enter rupees (INR), not paise.';
  if (/retention/.test(name)) return 'Leave blank unless a retention period has been approved; blank does not authorize deletion.';
  if (/grace days/.test(name)) return 'Leave blank unless extra grace days have been approved.';
  if (/rights note|rightsnote|licensing evidence|verification evidence|source note/.test(name)) return 'Add the license, permission or approved source reference a reviewer can check.';
  if (/document.*bytes/.test(name)) return '1 MiB = 1,048,576 bytes. The server upload limit still applies.';
  if (/mime/.test(name)) return 'Separate supported content types with commas, such as application/pdf,image/png.';
  if (/documents.*key|key.*label.*optional/.test(name)) return 'One per line: key | label | optional. Omit optional for required documents.';
  if (/cards.*heading/.test(name)) return 'One per line: heading | body | optional supported link key.';
  if (/footer links/.test(name)) return 'One per line: internal | /path or external | https://example.com. Maximum 10 links.';
  if (/table of contents/.test(name)) return 'Use the title/page entry format shown, with page numbers from the actual PDF.';
  if (/field schema|\bjson\b/.test(name)) return 'Use the supported JSON format; do not include scripts or secrets.';
  if (/^source$/.test(name)) return 'Use the supported source JSON with its authorization reference.';
  if (/section key \d+|^key$|content key/.test(name)) return 'Use a stable, unique reference; lessons and sections may depend on it.';
  if (/notification recipients|user database ids/.test(name)) return 'Separate existing user database IDs with commas. Check recipients before publishing.';
  if (/effective from|effective to/.test(name)) return 'Use a UTC date such as 2026-01-01T00:00:00Z; leave blank only when allowed.';
  if (/access after (?:confirmed )?(?:provider )?refund/.test(name)) return 'This controls access after a confirmed refund; it does not issue a refund.';
  if (/permission preset/.test(name)) return 'Review selected permissions before saving; grant only what this staff member needs.';
  if (/duration days/.test(name)) return 'Prepaid access in days. Use the approved plan duration.';
  if (/duration months/.test(name)) return 'Prepaid access in months. Use the approved plan duration.';
  if (/one per line/.test(name)) return 'Enter one item on each line.';
  return '';
}
