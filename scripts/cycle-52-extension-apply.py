#!/usr/bin/env python3
"""
Cycle 52-extension: mechanical requireAuth -> requireRole / requireEditor substitution.

Per thinker Option C strategy:
- Silo domains (warehouse/finance/etc.) -> entity-specific requireRole.
- Shared core -> requireEditor (blocks viewer only).
- Cart, dashboard/stats, order-history -> keep requireAuth().

Python implementation: regex-based parser to find `export async function METHOD(...)`
blocks, then substitute the specific `await requireAuth();` line WITHIN that block.

Idempotent: re-running with same config has no additional effect once substitutions
are applied (substitution target is `requireAuth()` only).
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

# Per-file, per-method substitution table from thinker Option C.
# Each entry: { 'file': abs_path,
#                'imports_to_add': [str],   # import names added to `@/lib/auth` destructure
#                'methods': {(METHOD_NAME_UPPER, replacement_call)} }
#
# METHOD_NAME_UPPER ∈ { 'GET', 'POST', 'PUT', 'PATCH', 'DELETE' }.
# replacement_call is what `await requireAuth();` becomes INSIDE that method handler.
# Methods NOT in the dict keep their existing `await requireAuth()` (don't touch them).

PROJECT_ROOT = Path(__file__).resolve().parents[1]

SUBSTITUTIONS = [
    # ── STRICT DOMAIN SILOS (Option B-style) ──
    # warehouses: admin + storekeeper
    {'file': 'src/app/api/warehouses/route.ts',
     'imports_to_add': ['requireRole'],
     'methods': [('POST', "await requireRole(['admin', 'storekeeper']);")]},
    {'file': 'src/app/api/warehouses/[id]/route.ts',
     'imports_to_add': ['requireRole'],
     'methods': [('PUT', "await requireRole(['admin', 'storekeeper']);"),
                 ('PATCH', "await requireRole(['admin', 'storekeeper']);"),
                 ('DELETE', "await requireRole(['admin', 'storekeeper']);")]},

    # storage-items: storekeeper
    {'file': 'src/app/api/storage-items/route.ts',
     'imports_to_add': ['requireRole'],
     'methods': [('POST', "await requireRole(['storekeeper']);")]},
    {'file': 'src/app/api/storage-items/[id]/route.ts',
     'imports_to_add': [],  # already imports requireEditor; upgrade to requireRole
     'methods': [('PUT', "await requireRole(['storekeeper']);"),
                 ('DELETE', "await requireRole(['storekeeper']);")]},

    # shipments: storekeeper
    {'file': 'src/app/api/shipments/route.ts',
     'imports_to_add': [],
     'methods': [('POST', "await requireRole(['storekeeper']);")]},
    # shipments/[id] already has requireEditor on writes; aligned to storekeeper:
    {'file': 'src/app/api/shipments/[id]/route.ts',
     'imports_to_add': [],
     'methods': [('PUT', "await requireRole(['storekeeper']);"),
                 ('PATCH', "await requireRole(['storekeeper']);"),
                 ('DELETE', "await requireRole(['storekeeper']);")]},

    # inventory-movements: storekeeper (auto-IN B.1 entity — storekeeper owns stock)
    {'file': 'src/app/api/inventory-movements/route.ts',
     'imports_to_add': ['requireRole'],
     'methods': [('POST', "await requireRole(['storekeeper']);")]},

    # reconciliation-acts: accountant
    {'file': 'src/app/api/reconciliation-acts/route.ts',
     'imports_to_add': ['requireRole'],
     'methods': [('POST', "await requireRole(['accountant']);")]},
    {'file': 'src/app/api/reconciliation-acts/[id]/route.ts',
     'imports_to_add': [],
     'methods': [('PUT', "await requireRole(['accountant']);"),
                 ('PATCH', "await requireRole(['accountant']);"),
                 ('DELETE', "await requireRole(['accountant']);")]},

    # order-closings: accountant
    {'file': 'src/app/api/order-closings/route.ts',
     'imports_to_add': ['requireRole'],
     'methods': [('POST', "await requireRole(['accountant']);")]},
    {'file': 'src/app/api/order-closings/[id]/route.ts',
     'imports_to_add': [],
     'methods': [('PUT', "await requireRole(['accountant']);"),
                 ('PATCH', "await requireRole(['accountant']);"),
                 ('DELETE', "await requireRole(['accountant']);")]},

    # proposals/[id]/convert: manager (cycle-42 precedent for manager)
    {'file': 'src/app/api/proposals/[id]/convert/route.ts',
     'imports_to_add': ['requireRole'],
     'methods': [('POST', "await requireRole(['manager']);")]},

    # contracts/[id]/convert-to-production: manager
    {'file': 'src/app/api/contracts/[id]/convert-to-production/route.ts',
     'imports_to_add': ['requireRole'],
     'methods': [('POST', "await requireRole(['manager']);")]},

    # tenders: manager (cycle 51 B.3 workflow precedent)
    {'file': 'src/app/api/tenders/route.ts',
     'imports_to_add': ['requireRole'],
     'methods': [('POST', "await requireRole(['manager']);")]},
    {'file': 'src/app/api/tenders/[id]/route.ts',
     'imports_to_add': [],
     'methods': [('PUT', "await requireRole(['manager']);"),
                 ('PATCH', "await requireRole(['manager']);"),
                 ('DELETE', "await requireRole(['manager']);")]},

    # order-tasks/[id]/assign: production + manager (dispatchers)
    {'file': 'src/app/api/order-tasks/[id]/assign/route.ts',
     'imports_to_add': ['requireRole'],
     'methods': [('PATCH', "await requireRole(['production', 'manager']);")]},

    # ── SHARED CORE (Option A pattern) — requireEditor blocks viewer only ──
    # Shared reference data:
    {'file': 'src/app/api/organizations/[id]/route.ts',
     'imports_to_add': [],
     'methods': [('PUT', "await requireEditor();"),
                 ('PATCH', "await requireEditor();"),
                 ('DELETE', "await requireEditor();")]},
    {'file': 'src/app/api/products/[id]/route.ts',
     'imports_to_add': [],
     'methods': [('POST', "await requireEditor();"),
                 ('PUT', "await requireEditor();"),
                 ('PATCH', "await requireEditor();"),
                 ('DELETE', "await requireEditor();")]},
    {'file': 'src/app/api/work-centers/[id]/route.ts',
     'imports_to_add': [],
     'methods': [('PUT', "await requireEditor();"),
                 ('PATCH', "await requireEditor();"),
                 ('DELETE', "await requireEditor();")]},
    {'file': 'src/app/api/work-types/[id]/route.ts',
     'imports_to_add': [],
     'methods': [('PUT', "await requireEditor();"),
                 ('PATCH', "await requireEditor();"),
                 ('DELETE', "await requireEditor();")]},
    {'file': 'src/app/api/workers/[id]/route.ts',
     'imports_to_add': [],
     'methods': [('PUT', "await requireEditor();"),
                 ('PATCH', "await requireEditor();"),
                 ('DELETE', "await requireEditor();")]},
    {'file': 'src/app/api/product-modules/[id]/route.ts',
     'imports_to_add': [],
     'methods': [('PUT', "await requireEditor();"),
                 ('PATCH', "await requireEditor();"),
                 ('DELETE', "await requireEditor();")]},

    # Procurement / customer / templates / production-list actions:
    {'file': 'src/app/api/purchase-requests/[id]/route.ts',
     'imports_to_add': [],
     'methods': [('PUT', "await requireEditor();"),
                 ('PATCH', "await requireEditor();"),
                 ('DELETE', "await requireEditor();")]},
    {'file': 'src/app/api/rpp-entries/[id]/route.ts',
     'imports_to_add': [],
     'methods': [('PUT', "await requireEditor();"),
                 ('PATCH', "await requireEditor();"),
                 ('DELETE', "await requireEditor();")]},
    {'file': 'src/app/api/inventor-files/[id]/route.ts',
     'imports_to_add': [],
     'methods': [('PUT', "await requireEditor();"),
                 ('PATCH', "await requireEditor();"),
                 ('DELETE', "await requireEditor();")]},
    {'file': 'src/app/api/certificates/[id]/route.ts',
     'imports_to_add': [],
     'methods': [('PUT', "await requireEditor();"),
                 ('PATCH', "await requireEditor();"),
                 ('DELETE', "await requireEditor();")]},
    {'file': 'src/app/api/clients/[id]/route.ts',
     'imports_to_add': [],
     'methods': [('PUT', "await requireEditor();"),
                 ('PATCH', "await requireEditor();"),
                 ('DELETE', "await requireEditor();")]},
    {'file': 'src/app/api/document-templates/[id]/route.ts',
     'imports_to_add': [],
     'methods': [('PUT', "await requireEditor();"),
                 ('PATCH', "await requireEditor();"),
                 ('DELETE', "await requireEditor();")]},
    {'file': 'src/app/api/table-templates/[id]/route.ts',
     'imports_to_add': [],
     'methods': [('PUT', "await requireEditor();"),
                 ('PATCH', "await requireEditor();"),
                 ('DELETE', "await requireEditor();")]},
    {'file': 'src/app/api/doc-types/[id]/route.ts',
     'imports_to_add': [],
     'methods': [('PUT', "await requireEditor();"),
                 ('PATCH', "await requireEditor();"),
                 ('DELETE', "await requireEditor();")]},
    {'file': 'src/app/api/order-tasks/[id]/route.ts',
     'imports_to_add': [],
     'methods': [('PUT', "await requireEditor();"),
                 ('PATCH', "await requireEditor();"),
                 ('DELETE', "await requireEditor();")]},
]


def apply_substitution(file_path: Path, methods: list[tuple[str, str]]) -> tuple[int, str]:
    """Substitute `await requireAuth();` calls WITHIN specific HTTP method handlers.

    Returns (count_substituted, status_message).
    """
    if not file_path.exists():
        return 0, f"FILE_NOT_FOUND: {file_path}"

    text = file_path.read_text(encoding='utf-8')

    # Detect function handler boundaries.
    # Pattern: `export async function METHOD(...) {`
    # We split the file into handler blocks; substitute the FIRST `await requireAuth();`
    # line that occurs AFTER the handler's opening line and BEFORE the next top-level
    # handler or the end of file (matching same indentation as opening).
    handler_pattern = re.compile(
        r'^export async function (GET|POST|PUT|PATCH|DELETE)\(',
        re.MULTILINE,
    )

    matches = list(handler_pattern.finditer(text))
    if not matches:
        return 0, f"NO_HANDLERS: {file_path}"

    # For each method in the substitution list, find the matching handler and replace.
    blocks_modified = 0
    new_text = text

    # Iterate via indices to allow in-place mutation of `new_text` correctly.
    # We do this by finding each handler's bounds (start idx of `function METHOD(` to start of next handler).
    handler_bounds = []  # list of (start_idx, end_idx, method_name)
    for i, m in enumerate(matches):
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        handler_bounds.append((start, end, m.group(1)))

    # Apply substitutions in reverse order (last handler first) so byte offsets
    # used in earlier handlers don't shift.
    for method_name, replacement in reversed(methods):
        # Find the handler block for this method.
        matching = [(s, e) for s, e, m in handler_bounds if m == method_name]
        if not matching:
            print(f"  WARN: {file_path.name} has no {method_name} handler", file=sys.stderr)
            continue

        # If multiple handlers of same name exist (unusual), replace each occurrence.
        for start, end in matching:
            block = new_text[start:end]
            # Find the first `await requireAuth();` line in this block.
            sub_pattern = re.compile(
                r'^(\s*)await requireAuth\(\);\s*$',
                re.MULTILINE,
            )
            sub_match = sub_pattern.search(block)
            if not sub_match:
                print(f"  WARN: no `await requireAuth();` in {method_name} of {file_path.name}",
                      file=sys.stderr)
                continue

            # Build replacement preserving indentation.
            indent = sub_match.group(1)
            full_replacement = f'{indent}{replacement}'

            # Apply in new_text (absolute offset = start + sub_match.start()).
            abs_start = start + sub_match.start()
            abs_end = start + sub_match.end()
            new_text = new_text[:abs_start] + full_replacement + new_text[abs_end:]
            blocks_modified += 1

    if blocks_modified == 0:
        return 0, f"NO_CHANGES: {file_path}"

    file_path.write_text(new_text, encoding='utf-8')
    return blocks_modified, f"MODIFIED: {file_path}"


def update_imports(file_path: Path, imports_to_add: list[str]) -> tuple[bool, str]:
    """Add required imports to existing `import { ... } from '@/lib/auth';` line.

    Returns (modified, status_message).
    """
    if not imports_to_add:
        return False, f"NO_IMPORTS_TO_ADD: {file_path}"

    if not file_path.exists():
        return False, f"FILE_NOT_FOUND: {file_path}"

    text = file_path.read_text(encoding='utf-8')

    # Find existing import from '@/lib/auth'.
    pattern = re.compile(
        r"^import \{([^}]+)\} from '@/lib/auth';\s*$",
        re.MULTILINE,
    )
    match = pattern.search(text)
    if not match:
        return False, f"NO_AUTH_IMPORT: {file_path}"

    current_imports_raw = match.group(1)
    # Strip `type ` qualifiers and split into identifiers.
    parsed: list[str] = []
    for token in current_imports_raw.split(','):
        token = token.strip()
        if not token:
            continue
        # Convert `type Foo` -> `Foo` (we add as value import; type imports handled separately later if needed).
        if token.startswith('type '):
            parsed.append(token.replace('type ', '', 1).strip())
        else:
            parsed.append(token)

    current_imports = set(parsed)
    additions = []
    for imp in imports_to_add:
        if imp not in current_imports:
            additions.append(imp)
            current_imports.add(imp)

    if not additions:
        return False, f"IMPORTS_ALREADY_PRESENT: {file_path}"

    # Reconstruct import line preserving `type ` qualifiers if originally present.
    new_imports = current_imports_raw.strip()
    if additions:
        # Append as new value imports at the END of the list, comma-separated.
        if new_imports:
            new_imports = new_imports + ', ' + ', '.join(additions)
        else:
            new_imports = ', '.join(additions)

    new_line = f"import {{{new_imports}}} from '@/lib/auth';"
    new_text = text[:match.start()] + new_line + text[match.end():]
    file_path.write_text(new_text, encoding='utf-8')

    return True, f"IMPORT_UPDATED: {file_path} (+{', '.join(additions)})"


def main() -> int:
    print(f"=== Cycle 52-extension Apply Script ===")
    print(f"Project root: {PROJECT_ROOT}")
    print(f"Substitutions to apply: {len(SUBSTITUTIONS)}\n")

    total_files_modified = 0
    total_blocks_substituted = 0
    total_imports_updated = 0
    errors = 0

    for entry in SUBSTITUTIONS:
        file_path = PROJECT_ROOT / entry['file']
        print(f"-- {entry['file']}")

        # Update imports first (so substitution step doesn't break if runner missed import).
        if entry['imports_to_add']:
            ok, msg = update_imports(file_path, entry['imports_to_add'])
            print(f"   imports: {msg}")
            if ok:
                total_imports_updated += 1
            elif 'NOT_FOUND' in msg or 'NO_AUTH_IMPORT' in msg:
                errors += 1
                continue

        # Apply substitutions.
        count, msg = apply_substitution(file_path, entry['methods'])
        print(f"   blocks: {msg} (count={count})")
        if count > 0:
            total_blocks_substituted += count
            total_files_modified += 1
        elif 'NOT_FOUND' in msg or 'NO_HANDLERS' in msg:
            errors += 1

    print(f"\n=== Summary ===")
    print(f"Files modified: {total_files_modified}/{len(SUBSTITUTIONS)}")
    print(f"Blocks substituted: {total_blocks_substituted}")
    print(f"Imports updated: {total_imports_updated}")
    print(f"Errors: {errors}")
    return 0 if errors == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
