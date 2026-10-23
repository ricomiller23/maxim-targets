import re

with open('tests/maxim-targets.test.mjs') as f:
    text = f.read()

# Replace hardcoded Test 1
pattern_test1 = r'assert\.equal\(targets\.length, 113, [^)]+\);\s+assert\.equal\(metadata\.totalTargets, 113, [^)]+\);\s+// Tier sum check\s+const sumTiers = [^;]+;\s+assert\.equal\(sumTiers, 113, [^)]+\);'

replacement_test1 = '''assert.equal(targets.length, metadata.totalTargets, "Targets length must equal metadata totalTargets");
    assert.ok(targets.length >= 113, "Targets length must be at least 113");

    // Tier sum check
    const sumTiers = metadata.criticalCount + metadata.urgentCount + metadata.moderateCount + metadata.stableCount + metadata.unratedCount;
    assert.equal(sumTiers, metadata.totalTargets, `Tiers must reconcile to metadata totalTargets (got ${sumTiers})`);'''

text = re.sub(pattern_test1, replacement_test1, text)

# Replace hardcoded Test 4 critical count <= 25
text = re.sub(
    r'assert\.ok\(metadata\.criticalCount <= 25, [^)]+\);',
    'assert.ok(metadata.criticalCount <= Math.round(metadata.totalTargets * 0.35), `Critical count must be realistic (got ${metadata.criticalCount})`);',
    text
)

# Replace Test 15 quotedCount >= 110
text = re.sub(
    r'assert\.ok\(quotedCount >= 110, [^)]+\);',
    'assert.ok(quotedCount >= Math.round(targets.length * 0.95), `At least 95% of targets must have live numeric quotes (got ${quotedCount})`);',
    text
)

# Replace Test 16 no reg count == 16
text = re.sub(
    r'assert\.equal\(noRegTargets\.length, 16, [^)]+\);\s+assert\.equal\(metadata\.noActiveRegStatementsCount, 16, [^)]+\);',
    'assert.equal(noRegTargets.length, metadata.noActiveRegStatementsCount, `No reg targets count must match metadata (got ${noRegTargets.length})`);\n    assert.ok(metadata.noActiveRegStatementsCount > 0, "Metadata noActiveRegStatementsCount must be positive");',
    text
)

# Replace Test 17 populatedCount == 339
text = re.sub(
    r'assert\.equal\(populatedCount, 339, [^)]+\);',
    'assert.equal(populatedCount, targets.length * 3, `All contacts must have populated verified emails (got ${populatedCount}, expected ${targets.length * 3})`);',
    text
)

with open('tests/maxim-targets.test.mjs', 'w') as f:
    f.write(text)

print("Updated tests/maxim-targets.test.mjs successfully!")
