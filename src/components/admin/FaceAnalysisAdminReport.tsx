'use client';

import React from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getFaceShapeIcon } from '@/config/face-analysis';
import { FaceLandmarkMeshOverlay } from '@/components/face-analysis/FaceLandmarkMeshOverlay';
import type {
  FaceAnalysisBasicResult,
  FaceAnalysisFullResult,
  FaceAnalysisMetric,
  FaceGeometryAnalysis,
  FrameRecommendation,
} from '@/types/face-analysis';

interface FaceAnalysisAdminReportProps {
  userImageUrl: string;
  detectedShape: string | null;
  confidence: number | null;
  basicResult: FaceAnalysisBasicResult | null;
  fullResult: FaceAnalysisFullResult | null;
  metadata?: Record<string, unknown> | null;
}

function asGeometry(value: unknown): FaceGeometryAnalysis | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const g = value as FaceGeometryAnalysis;
  return g.version === 'landmark-v1' ? g : undefined;
}

function resolveReportData(props: FaceAnalysisAdminReportProps) {
  const basic = props.basicResult;
  const full = props.fullResult;
  const metadata = props.metadata ?? {};
  const geometry =
    full?.geometry ??
    basic?.geometry ??
    asGeometry(metadata.geometry);

  return {
    basic,
    full,
    geometry,
    reportVersion: full?.reportVersion,
    model: typeof metadata.model === 'string' ? metadata.model : undefined,
    completionTimeMs:
      typeof metadata.completionTimeMs === 'number' ? metadata.completionTimeMs : undefined,
    serviceType: typeof metadata.serviceType === 'string' ? metadata.serviceType : undefined,
  };
}

function formatPercent(value: number | null | undefined) {
  if (value == null) return '—';
  return `${Math.round(value * 100)}%`;
}

function formatRatioLabel(key: string) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase());
}

export default function FaceAnalysisAdminReport(props: FaceAnalysisAdminReportProps) {
  const { userImageUrl, detectedShape, confidence } = props;
  const { basic, full, geometry, reportVersion, model, completionTimeMs, serviceType } =
    resolveReportData(props);

  const hasMeasuredGeometry = geometry?.status === 'measured';
  const metrics = full?.metrics ?? [];
  const recommended = full?.frameRecommendations ?? [];
  const avoid = full?.avoidRecommendations ?? [];
  const shape = basic?.faceShape ?? detectedShape;
  const ShapeIcon = shape ? getFaceShapeIcon(shape) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {reportVersion && <Badge variant="outline">Report {reportVersion}</Badge>}
        {hasMeasuredGeometry ? (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Landmark measured</Badge>
        ) : (
          <Badge variant="secondary">AI-only</Badge>
        )}
        {model && <Badge variant="outline">{model}</Badge>}
        {serviceType && <Badge variant="outline">{serviceType}</Badge>}
        {completionTimeMs != null && (
          <Badge variant="outline">{completionTimeMs}ms</Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-[200px_minmax(0,1fr)]">
        <div>
          <div className="relative aspect-[4/5] w-full max-w-[200px] overflow-hidden rounded-lg border bg-gray-100">
            <Image src={userImageUrl} alt="User" fill className="object-cover" sizes="200px" />
            <FaceLandmarkMeshOverlay
              imageUrl={userImageUrl}
              className="absolute inset-0 h-full w-full pointer-events-none"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {hasMeasuredGeometry ? 'Landmark mesh overlay' : 'Wireframe fallback'}
          </p>
        </div>

        <div className="space-y-3">
          {shape && (
            <div className="flex items-center gap-3">
              {ShapeIcon && (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <ShapeIcon className="h-5 w-5" />
                </div>
              )}
              <div>
                <p className="text-lg font-semibold capitalize">
                  {basic?.faceShapeDisplayName ?? shape}
                </p>
                <p className="text-sm text-muted-foreground">
                  AI shape: {detectedShape ?? shape} · {formatPercent(confidence ?? basic?.confidence)} confidence
                </p>
              </div>
            </div>
          )}
          {(full?.overview?.summary || basic?.summary) && (
            <p className="text-sm text-muted-foreground leading-6">
              {full?.overview?.summary || basic?.summary}
            </p>
          )}
          {(full?.overview?.strengths ?? basic?.keyFeatures ?? []).length > 0 && (
            <ul className="text-sm list-disc list-inside text-muted-foreground space-y-1">
              {(full?.overview?.strengths ?? basic?.keyFeatures ?? []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {geometry && <GeometrySection geometry={geometry} aiShape={detectedShape} />}

      {metrics.length > 0 && <MetricsSection metrics={metrics} />}

      {recommended.length > 0 && (
        <RecommendationsSection title="Recommended Frames" items={recommended} variant="recommended" />
      )}

      {avoid.length > 0 && (
        <RecommendationsSection title="Frames to Avoid" items={avoid} variant="avoid" />
      )}

      {full?.styleTips && full.styleTips.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Style Tips</h3>
          <div className="space-y-2">
            {full.styleTips.map((tip) => (
              <div key={tip.title} className="rounded border p-3 text-sm">
                <p className="font-medium">{tip.title}</p>
                <p className="text-muted-foreground mt-1">{tip.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {full?.tryOnGuidance && (
        <div>
          <h3 className="text-sm font-medium mb-2">Try-On Guidance</h3>
          <p className="text-sm text-muted-foreground">{full.tryOnGuidance.note}</p>
          <p className="text-sm mt-2">
            <span className="text-muted-foreground">Top styles: </span>
            {full.tryOnGuidance.topStyles.join(', ')}
          </p>
        </div>
      )}

      {!full && basic && (
        <div>
          <h3 className="text-sm font-medium mb-2">Basic Result Only</h3>
          <p className="text-sm text-muted-foreground">
            Full v2 report not stored or task failed before completion.
          </p>
        </div>
      )}

      {full && !metrics.length && (full.bestFrames?.length || full.styleGuide) && (
        <div>
          <h3 className="text-sm font-medium mb-2">Legacy Report Fields</h3>
          {full.styleGuide && (
            <p className="text-sm text-muted-foreground mb-2">{full.styleGuide}</p>
          )}
          {full.bestFrames?.length > 0 && (
            <p className="text-sm">
              <span className="text-muted-foreground">Best: </span>
              {full.bestFrames.join(', ')}
            </p>
          )}
          {full.framesToAvoid?.length > 0 && (
            <p className="text-sm mt-1">
              <span className="text-muted-foreground">Avoid: </span>
              {full.framesToAvoid.join(', ')}
            </p>
          )}
        </div>
      )}

      {full?.overview?.disclaimer && (
        <p className="text-xs text-muted-foreground border-t pt-3">{full.overview.disclaimer}</p>
      )}
    </div>
  );
}

function GeometrySection({
  geometry,
  aiShape,
}: {
  geometry: FaceGeometryAnalysis;
  aiShape: string | null;
}) {
  const measured = geometry.status === 'measured';

  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Landmark Geometry</h3>
      <div className="rounded border p-4 space-y-3 text-sm">
        <div className="flex flex-wrap gap-2">
          <Badge variant={measured ? 'default' : 'secondary'}>{geometry.status}</Badge>
          <Badge variant="outline">{geometry.source}</Badge>
          {measured && geometry.measuredShape && (
            <Badge variant="outline" className="gap-1">
              Measured: {geometry.measuredShape}
              {aiShape && geometry.measuredShape !== aiShape && (
                <span className="text-amber-600">≠ AI {aiShape}</span>
              )}
            </Badge>
          )}
          {geometry.measuredConfidence != null && (
            <Badge variant="outline">
              Measured conf: {Math.round(geometry.measuredConfidence * 100)}%
            </Badge>
          )}
          <Badge variant="outline">Quality {geometry.qualityScore}%</Badge>
          <Badge variant="outline">Faces {geometry.faceCount}</Badge>
        </div>

        {geometry.signals.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Signals</p>
            <ul className="list-disc list-inside text-muted-foreground">
              {geometry.signals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
          </div>
        )}

        {geometry.warnings.length > 0 && (
          <div className="rounded bg-amber-50 border border-amber-100 px-3 py-2 text-amber-900 text-xs">
            {geometry.warnings.join(' ')}
          </div>
        )}

        {geometry.ratios && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Ratios</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {Object.entries(geometry.ratios).map(([key, value]) => (
                <div key={key} className="rounded bg-muted/50 px-2 py-1.5">
                  <span className="text-muted-foreground">{formatRatioLabel(key)}: </span>
                  <span className="font-mono">{typeof value === 'number' ? value.toFixed(3) : value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricsSection({ metrics }: { metrics: FaceAnalysisMetric[] }) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Face Metrics</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {metrics.map((metric) => (
          <div key={metric.id} className="rounded border p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{metric.label}</p>
              {metric.source && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {metric.source}
                </Badge>
              )}
            </div>
            <p className="text-blue-700 font-semibold mt-1">{metric.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{metric.caption}</p>
            <p className="text-xs text-muted-foreground mt-1">{metric.detail}</p>
            <p className="text-xs font-medium mt-2">{metric.score}% score</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendationsSection({
  title,
  items,
  variant,
}: {
  title: string;
  items: FrameRecommendation[];
  variant: 'recommended' | 'avoid';
}) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-2">{title}</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Frame</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Styling</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.type}>
              <TableCell className="font-medium">{item.displayName}</TableCell>
              <TableCell>
                <Badge variant={variant === 'avoid' ? 'destructive' : 'default'}>
                  {item.score}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[200px]">
                {item.reason}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[200px]">
                {item.stylingNote}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
