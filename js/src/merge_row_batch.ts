// Mirrors the implementation of merge_row_batch in api/chalicelib/util.py.
//
// TODO(manu): Share common functionality between SDK and chalicelib.

import { IS_MERGE_FIELD, mergeDicts } from "./util";

const DATA_OBJECT_KEYS = [
  "org_id",
  "project_id",
  "experiment_id",
  "dataset_id",
  "prompt_session_id",
  "log_id",
];

function generateUniqueRowKey(row: Record<string, any>) {
  const coalesceEmpty = (field: string) => row[field] ?? "";
  return DATA_OBJECT_KEYS.concat(["id"]).map(coalesceEmpty).join(":");
}

export function mergeRowBatch(
  rows: Record<string, any>[]
): Record<string, any>[] {
  const out: Record<string, any>[] = [];
  const remainingRows: Record<string, any>[] = [];
  // First add any rows with no ID to `out`, since they will always be
  // independent.
  for (const row of rows) {
    if (row["id"] === undefined) {
      out.push(row);
    } else {
      remainingRows.push(row);
    }
  }
  const rowGroups: Record<string, Record<string, any>> = {};
  for (const row of remainingRows) {
    const key = generateUniqueRowKey(row);
    const existingRow = rowGroups[key];
    if (existingRow !== undefined && row[IS_MERGE_FIELD]) {
      const preserveNoMerge = !existingRow[IS_MERGE_FIELD];
      mergeDicts(existingRow, row);
      if (preserveNoMerge) {
        delete existingRow[IS_MERGE_FIELD];
      }
    } else {
      rowGroups[key] = row;
    }
  }
  out.push(...Object.values(rowGroups));
  return out;
}