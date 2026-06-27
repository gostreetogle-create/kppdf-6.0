#!/usr/bin/perl
use strict;
use warnings;
use utf8;

# scripts/inject-audit-toc.pl
# One-shot: autogenerate TOC for `audit-log.md` + insert explicit <a id="cycle-N">
# anchors before each cycle entry. **Idempotent:** YES — strip-pass removes
# pre-existing `<a id="cycle-N"></a>` lines before re-applying (also re-applies
# the TOC block at the same splice-point). Safe to re-run on already-processed file.
# Usage:
#   cp audit-log.md audit-log.md.bak  # safety net
#   perl scripts/inject-audit-toc.pl  # default file (audit-log.md)
#   perl scripts/inject-audit-toc.pl /path/to/other-log.md  # explicit path
#
# Note: `shift @ARGV // 'audit-log.md'` uses defined-or (//), not logical-or (||),
# so a literal path "0" would NOT silently fall back to the default.

my $path = shift @ARGV // 'audit-log.md';

open my $in, '<:encoding(UTF-8)', $path or die "open failed: $!";
local $/;
my $content = <$in>;
close $in;

my @lines = split /(?<=\n)/, $content;
my $orig_count = scalar @lines;

# Find headers
my @entries;
for (my $i = 0; $i <= $#lines; $i++) {
    next unless $lines[$i] =~ /^(##|###) Cycle (\d+)\b/;
    my $depth = $1;
    my $num = $2;
    my $raw = $lines[$i];
    $raw =~ s/\s+\z//;
    my $date = '';
    my $title = '';
    if ($raw =~ /^#+\s+Cycle\s+\d+\s*[-—–]+\s*(\d{4}-\d{2}-\d{2})\s*[-—–]+\s*(.+?)\s*$/) {
        $date = $1;
        $title = $2;
    }
    push @entries, { num => $num, depth => $depth, date => $date, title => $title, line_no => $i + 1 };
}

# Strip pre-existing markers + OLD TOC block (full idempotency).
# Strip targets:
#   (1) Anchor lines:     ^<a id="cycle-N"></a>\s*$
#   (2) OLD TOC block:    starts at ^##\s+Index of Cycles\b
#                        ends   at first ^---\s*$ after the title
#                        (consumes the "---" separator line so the
#                         re-applied splice produces a single "---")
my %anchor_lines_seen;
my $toc_blocks_seen = 0;
my @cleaned;
my $skip_toc_block = 0;
for (my $i = 0; $i <= $#lines; $i++) {
    my $line = $lines[$i];

    # (1) Anchor markers — track for diagnostic.
    if ($line =~ /^<a id="cycle-(\d+)"><\/a>\s*$/) {
        $anchor_lines_seen{$1}++;
        next;
    }

    # (2) OLD TOC block — start skipping when we see the title line.
    if ($line =~ /^##\s+Index of Cycles\b/) {
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
    print "Stripped ", scalar(keys %anchor_lines_seen), " pre-existing anchor lines (idempotency).\n";
}
if ($toc_blocks_seen) {
    print "Stripped $toc_blocks_seen pre-existing TOC block(s) (idempotency).\n";
}

# Re-locate cycle headers post-strip
@entries = ();
for (my $i = 0; $i <= $#lines; $i++) {
    next unless $lines[$i] =~ /^(##|###) Cycle (\d+)\b/;
    my $depth = $1;
    my $num = $2;
    my $raw = $lines[$i];
    $raw =~ s/\s+\z//;
    my $date = '';
    my $title = '';
    if ($raw =~ /^#+\s+Cycle\s+\d+\s*[-—–]+\s*(\d{4}-\d{2}-\d{2})\s*[-—–]+\s*(.+?)\s*$/) {
        $date = $1;
        $title = $2;
    }
    push @entries, { num => $num, depth => $depth, date => $date, title => $title, line_no => $i + 1 };
}

# Insert explicit anchors before each cycle header
my @new;
for (my $i = 0; $i <= $#lines; $i++) {
    my $target_num;
    for my $e (@entries) {
        if ($e->{line_no} == $i + 1) { $target_num = $e->{num}; last; }
    }
    if (defined $target_num) {
        push @new, '<a id="cycle-' . $target_num . '"></a>' . "\n";
    }
    push @new, $lines[$i];
}

# Build TOC
my $toc = '';
$toc .= '##  Index of Cycles / Содержание' . "\n\n";
$toc .= '_Авто-генерированный TOC для `audit-log.md`. Якоря: explicit `<a id="cycle-N">` markers, проставленные перед каждым cycle-разделом. Портативны во всех markdown-рендерерах (GitHub / GitLab / VSCode / Typora). Перегенерация: `perl scripts/inject-audit-toc.pl` (идемпотентно — перед новой вставкой удаляет старые anchor-strokes)._' . "\n\n";
my $h2_count = scalar(grep { $_->{depth} eq '##' } @entries);
my $h3_count = scalar(grep { $_->{depth} eq '###' } @entries);
$toc .= '**Всего cycle-entries:** ' . scalar(@entries) . ' (## = ' . $h2_count . ', ### = ' . $h3_count . ').' . "\n\n";
for my $e (@entries) {
    my $line = '- [Cycle ' . $e->{num};
    $line .= ' — ' . $e->{date} if $e->{date} ne '';
    $line .= ' — ' . $e->{title} if $e->{title} ne '';
    $line .= '](#cycle-' . $e->{num} . ')' . "\n";
    $toc .= $line;
}
$toc .= "\n---\n\n";

# Splice TOC after H1
my $h1_pos = -1;
for (my $i = 0; $i <= $#new; $i++) {
    if ($new[$i] =~ /^# /) { $h1_pos = $i; last; }
}
die "no H1 found in $path\n" if $h1_pos < 0;

my @result = (@new[0..$h1_pos], $toc, @new[$h1_pos+1..$#new]);

open my $out, '>:encoding(UTF-8)', $path or die "write failed: $!";
print $out @result;
close $out;

print "OK: " . scalar(@entries) . " entries indexed. line_count: $orig_count -> " . scalar(@result) . " (+" . (scalar(@result) - $orig_count) . ").\n";
