"use client";

import { formatDistanceToNowStrict } from "date-fns";

import type { ActivityItem } from "@/components/dashboard/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function statusVariant(status: ActivityItem["status"]) {
  if (status === "SUCCESS") return "default";
  if (status === "FAILED") return "destructive";
  return "secondary";
}

export function ActivityLog({ logs }: { logs: ActivityItem[] }) {
  return (
    <Card className="border-white/10 bg-slate-950/50">
      <CardHeader>
        <CardTitle className="text-lg">Activity Log</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Repository</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>SHA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-400">
                    No activity yet.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs text-slate-300">
                      {formatDistanceToNowStrict(new Date(log.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.repo.repoOwner}/{log.repo.repoName}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(log.status)}>{log.status}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[340px] truncate text-slate-300">{log.message}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-300">{log.commitSha?.slice(0, 8) ?? "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
