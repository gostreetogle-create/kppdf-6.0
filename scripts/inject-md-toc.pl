#!/usr/bin/perl
use strict;
use warnings;
use utf8;

# scripts/inject-md-toc.pl
#
# Generalized markdown TOC injector. For each ##/###/#### heading in the
# target file, inserts an ordinal `<a id="heading-N">` marker BEFORE the
# heading line and adds a corresponding entry to a markdown TOC block placed
# right after the file's H1 title.
#
# Why ordinal anchors (`heading-1`, `heading-2`, ..., NOT `heading-1-1`, etc.)?
# Because the cycle-history / spec files use FIVE different header conventions:
#   - `## Cycle N — date — title`  (audit-log.md — handled by inject-audit-toc.pl)
#   - `### N.M ✅ Title`            (ЧEК-ЛИСТ-РЕАЛИЗАЦИИ)
#   - `### N.M. Title`             (КРИТИЧЕСКИЙ-АНАЛИЗ)
#   - `## N. emoji Title`          (ЧEК-ЛИСТ-МИГРАЦИИ, SPEC.md)
#   - `## 🟢 Title`                (ЧEК-ЛИСТ-КАЧЕСТВА — no numbers)
#   - `### Модуль (Param)`         (ЧEК-ЛИСТ-КАЧЕСТВА — label-pattern)
# A single ordinal counter works for ALL of them: each heading, in order of
# appearance, gets the next number.
#
# Idempotency: strip-pass removes pre-existing `<a id="..."></a>` markers
# AND any pre-existing TOC block (detected by `^##\s+(Index of |Содержание)`
# title line → consume until first `---` separator).
#
# Usage:
#   perl scripts/inject-md-toc.pl <file>
#
# This script does NOT touch audit-log.md. Use inject-audit-toc.pl for that
# file (different anchor scheme + cycle-specific TOC title).

my $path = shift @ARGV // die "Usage: perl $0 <file.md>\n";

# Dynamic TOC title (filename-derived for nicer TOC headers).
my $toc_title = 'Index of Sections / Содержание';

open my $in, '<:encoding(UTF-8)', $path or die "open failed: $!";
local $/;
my $content = <$in>;
close $in;

my @lines = split /(?<=\n)/, $content;
my $orig_count = scalar @lines;

# ── Pass 1: locate all ##/###/#### headings ──
my @entries;
for (my $i = 0; $i <= $#lines; $i++) {
    next unless $lines[$i] =~ /^(#{1,4}) (.+)$/;
    my $depth = $1;
    my $title_raw = $2;
    $title_raw =~ s/\s+\z//;
    push @entries, {
        depth   => $depth,
        title   => $title_raw,
        line_no => $i + 1,
    };
}

# ── Strip pre-existing anchors + OLD TOC block (idempotency) ──
my %anchor_lines_seen;
my $toc_blocks_seen = 0;
my @cleaned;
my $skip_toc_block = 0;
for (my $i = 0; $i <= $#lines; $i++) {
    my $line = $lines[$i];

    # (1) Anchor markers — track for diagnostic.
    if ($line =~ /^<a id="([^"]+)"><\/a>\s*$/) {
        $anchor_lines_seen{$1}++;
        next;
    }

    # (2) OLD TOC block — start skipping when we see the title line.
    if ($line =~ /^##\s+(Index of |Содержание)/) {
        $skip_toc_block = 1;
        $toc_blocks_seen++;
        next;
    }
    # Continue skipping until first "---" line, then resume.
    if ($skip_toc_block) {
        $skip_toc_block = 0 if $line =~ /^---\s*$/;
        next;
    }

    push @cleaned, $line;
}
my @lines = @cleaned;
if (%anchor_lines_seen) {
    print "Stripped ", scalar(keys %anchor_lines_seen), " pre-existing anchor lines.\n";
}
if ($toc_blocks_seen) {
    print "Stripped $toc_blocks_seen pre-existing TOC block(s).\n";
}

# ── Re-locate headings post-strip ──
@entries = ();
for (my $i = 0; $i <= $#lines; $i++) {
    next unless $lines[$i] =~ /^(#{1,4}) (.+)$/;
    my $depth = $1;
    my $title_raw = $2;
    $title_raw =~ s/\s+\z//;
    push @entries, {
        depth   => $depth,
        title   => $title_raw,
        line_no => $i + 1,
    };
}

# ── Insert ordinal anchors before each heading ──
my @new;
my $ordinal = 0;
for (my $i = 0; $i <= $#lines; $i++) {
    my $target;
    for my $e (@entries) {
        if ($e->{line_no} == $i + 1) {
            $ordinal++;
            $target = $e;
            $target->{ordinal} = $ordinal;
            last;
        }
    }
    if (defined $target) {
        push @new, '<a id="heading-' . $ordinal . '"></a>' . "\n";
    }
    push @new, $lines[$i];
}

# ── Build TOC ──
my $toc = '';
$toc .= '## ' . $toc_title . "\n\n";
$toc .= '_Авто-генерированный TOC. Якоря: `<a id="heading-N">` ordinal anchors, '
     .  'портативны во всех markdown-рендерерах (GitHub / GitLab / VSCode / Typora). '
     .  'Перегенерация: `perl scripts/inject-md-toc.pl <file>` (идемпотентно — '
     .  'перед новой вставкой удаляет старые anchor-markers + старый TOC-блок)._' . "\n\n";

# Heading-depth histogram.
my %depth_count;
for my $e (@entries) { $depth_count{$e->{depth}}++; }
my @depth_summary = map { "$_ = $depth_count{$_}" } sort { length($a) <=> length($b) } keys %depth_count;
$toc .= '**Всего headings:** ' . scalar(@entries) . ' (' . join(', ', @depth_summary) . ").\n\n";

# TOC list — preserve hierarchy visually by indenting non-## depth.
my $prev_depth_count = 0;
for my $e (@entries) {
    my $indent = '';
    if ($e->{depth} eq '###') { $indent = '  '; }
    elsif ($e->{depth} eq '####') { $indent = '    '; }
    $toc .= $indent . '- [' . $e->{title} . '](#heading-' . $e->{ordinal} . ")\n";
}
$toc .= "\n---\n\n";

# ── Splice TOC after H1 ──
my $h1_pos = -1;
for (my $i = 0; $i <= $#new; $i++) {
    if ($new[$i] =~ /^# /) { $h1_pos = $i; last; }
}
die "no H1 found in $path\n" if $h1_pos < 0;

my @result = (@new[0..$h1_pos], $toc, @new[$h1_pos+1..$#new]);

open my $out, '>:encoding(UTF-8)', $path or die "write failed: $!";
print $out @result;
close $out;

print "OK [$path]: " . scalar(@entries) . " headings indexed. ";
print "line_count: $orig_count -> " . scalar(@result) . " (+" . (scalar(@result) - $orig_count) . ").\n";
