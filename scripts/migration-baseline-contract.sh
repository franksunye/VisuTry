#!/usr/bin/env bash

# Frozen identity for the future canonical baseline. DB1A only teaches the
# deployment boundary how to recognize it; this directory is intentionally not
# present in the active Prisma migration tree yet.
CANONICAL_BASELINE_MIGRATION="20261003000000_canonical_schema_baseline"
