/**
 * VisuTry Analytics Event Registry v2
 *
 * Canonical business events. These names are stable contracts shared by:
 * - GA4
 * - dataLayer
 * - Campaign Intelligence
 * - future merchant / SDK analytics
 */

export const ANALYTICS_SCHEMA_VERSION = '2' as const

export const AnalyticsEvent = {
  CampaignLanded: 'campaign_landed',
  CampaignEngaged: 'campaign_engaged',

  FaceAnalysisStarted: 'face_analysis_started',
  FaceAnalysisPhotoUploaded: 'face_analysis_photo_uploaded',
  FaceAnalysisCompleted: 'face_analysis_completed',
  FaceAnalysisFailed: 'face_analysis_failed',

  FaceShapeDetectionStarted: 'face_shape_detection_started',
  FaceShapeDetectionCompleted: 'face_shape_detection_completed',
  FaceShapeDetectionFailed: 'face_shape_detection_failed',
  FaceShapePhotoUploaded: 'face_shape_photo_uploaded',

  TryOnStarted: 'tryon_started',
  TryOnCompleted: 'tryon_completed',
  TryOnFailed: 'tryon_failed',

  RecommendationViewed: 'recommendation_viewed',
  ComparisonCreated: 'comparison_created',
  ComparisonCompleted: 'comparison_completed',
  FrameFavorited: 'frame_favorited',

  PurchaseIntentClicked: 'purchase_intent_clicked',
  StoreVisitRequested: 'store_visit_requested',
  LeadCreated: 'lead_created',
  JourneyContinued: 'journey_continued',
} as const

export type AnalyticsEventName =
  (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent]

export type AnalyticsSurface =
  | 'web'
  | 'mobile_web'
  | 'pwa'
  | 'sdk'
  | 'merchant_store'

export type AnalyticsEntryPoint =
  | 'consumer'
  | 'campaign'
  | 'store'
  | 'blog'
  | 'sdk'
  | 'unknown'

export type ComparisonCompletionStatus = 'full' | 'partial' | 'failed'

export type JourneyDestination =
  | 'face_analysis'
  | 'glasses_advisor'
  | 'virtual_try_on'
  | 'frame_compare'
  | 'face_shape_guide'
  | 'store'
  | 'pricing'
  | string

export type StoreLeadType = 'sample' | 'demo' | 'catalog' | 'partnership' | string

export type AnalyticsCommonContext = {
  analytics_schema_version: typeof ANALYTICS_SCHEMA_VERSION
  landing_page?: string
  page_path?: string
  acquisition_source?: string
  acquisition_medium?: string
  landing_locale?: string
  browser_language?: string
  source_page?: string
  query_cluster?: string
  content_cluster?: string
  product_path?: string
  campaign_id?: string
  merchant_id?: string
  store_id?: string
  surface?: AnalyticsSurface
  entry_point?: AnalyticsEntryPoint
  source_journey?: string
  destination?: JourneyDestination
  landing_surface?: string
  intent_type?: string
  lead_type?: StoreLeadType
  user_intent?: string
  face_shape?: string
  frame_category?: string
}
