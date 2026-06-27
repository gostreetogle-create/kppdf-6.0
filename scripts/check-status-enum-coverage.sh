#!/usr/bin/env bash
# scripts/check-status-enum-coverage.sh
#
# Pre-flight check: verify all existing status values in the database
# can be mapped to the new Prisma enums before migration.
#
# Exit codes:
#   0  CLEAN — all values are valid
#   1  ROGUE VALUES — some values need backfill before migration

set -u

ECHO_PREFIX="[status-enum-check]"
DB_PATH="prisma/dev.db"

if [ ! -f "$DB_PATH" ]; then
  printf '%s ❌ Database not found: %s\n' "$ECHO_PREFIX" "$DB_PATH"
  exit 1
fi

VIOLATIONS=0

check_distinct() {
  local table="$1"
  local column="$2"
  local allowed="$3"

  printf '%s Checking %s.%s...\n' "$ECHO_PREFIX" "$table" "$column"

  VALUES=$(sqlite3 "$DB_PATH" "SELECT DISTINCT \"$column\" FROM \"$table\" WHERE \"$column\" IS NOT NULL;" 2>/dev/null || echo "")

  if [ -z "$VALUES" ]; then
    printf '  ✅ No values (empty table)\n'
    return
  fi

  while IFS= read -r val; do
    if echo "$allowed" | grep -qF "\"$val\""; then
      printf '  ✅ "%s"\n' "$val"
    else
      printf '  ❌ ROGUE: "%s" (not in allowed list)\n' "$val"
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  done <<< "$VALUES"
}

echo "--- Status Enum Coverage Check ---"
echo ""

# Proposal
check_distinct "Proposal" "status" '"draft","sent","accepted","rejected","converted","paid"'

# Contract
check_distinct "Contract" "status" '"draft","active","completed","cancelled"'

# ProductionOrder
check_distinct "ProductionOrder" "status" '"planned","in_progress","manufacturing","painting","shipping","completed","cancelled"'

# OrderTask
check_distinct "OrderTask" "status" '"pending","in_progress","completed","blocked"'

# PurchaseRequest
check_distinct "PurchaseRequest" "status" '"draft","approved","ordered","received","cancelled"'

# SupplierOrder
check_distinct "SupplierOrder" "status" '"draft","confirmed","shipped","delivered","cancelled"'

# IncomingInvoice
check_distinct "IncomingInvoice" "status" '"draft","paid","overdue"'

# Shipment
check_distinct "Shipment" "status" '"draft","partially","shipped","cancelled"'

# OrderClosing
check_distinct "OrderClosing" "status" '"draft","approved","completed"'

# ReconciliationAct
check_distinct "ReconciliationAct" "status" '"draft","signed"'

# Tender
check_distinct "Tender" "status" '"draft","submitted","won","lost","cancelled"'

# RppEntry
check_distinct "RppEntry" "status" '"draft","published"'

# Certificate
check_distinct "Certificate" "status" '"draft","active","expired","revoked"'

# InventoryMovement
check_distinct "InventoryMovement" "type" '"in","out","transfer"'

echo ""
echo "--- Summary ---"

if [ "$VIOLATIONS" -eq 0 ]; then
  printf '%s ✅ CLEAN — all status values are valid for enum migration\n' "$ECHO_PREFIX"
  exit 0
else
  printf '%s ❌ %d ROGUE VALUE(S) found — backfill before migration\n' "$ECHO_PREFIX" "$VIOLATIONS"
  exit 1
fi
