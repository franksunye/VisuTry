/**
 * VisuTry Analytics Event Registry v2
 *
 * Canonical business events. These names are stable contracts shared by:
 * - GA4
 * - dataLayer
 * - Campaign Intelligence
 * - future merchant / SDK analytics
 *
 * Important separation:
 * - Shopper Campaign events (campaign_landed, tryon_*, purchase_intent_clicked, lead_created)
 *   describe C-end shoppers inside a merchant/brand campaign.
 * - B2B Acquisition events (b2b_*) describe merchant prospects evaluating VisuTry Store.
 *   Never mix these funnels in Brand Dashboard metrics.
 */

export const ANALYTICS_SCHEMA_VERSION = '2' as const

export const AnalyticsEvent = {
  // Shopper / merchant campaign intelligence (C-end)
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
  TryOnShared: 'tryon_shared',

  RecommendationStarted: 'recommendation_started',
  RecommendationViewed: 'recommendation_viewed',
  ComparisonCreated: 'comparison_created',
  ComparisonCompleted: 'comparison_completed',
  FrameFavorited: 'frame_favorited',

  PurchaseIntentClicked: 'purchase_intent_clicked',
  PaywallViewed: 'paywall_viewed',
  StoreVisitRequested: 'store_visit_requested',
  LeadCreated: 'lead_created',
  JourneyContinued: 'journey_continued',

  // VisuTry Store B2B acquisition (merchant prospects on /store marketing LP)
  B2bLandingViewed: 'b2b_landing_viewed',
  B2bSalesIntentClicked: 'b2b_sales_intent_clicked',
  B2bLeadFormStarted: 'b2b_lead_form_started',
  B2bLeadCreated: 'b2b_lead_created',
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
  | 'b2b'
  | 'unknown'

export type AnalyticsActorType =
  | 'shopper'
  | 'merchant_prospect'
  | 'unknown'

export type AnalyticsJourneyType =
  | 'shopper_campaign'
  | 'visutry_b2b_acquisition'
  | 'consumer_organic'

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

export type FaceFailureReason =
  | 'no_face'
  | 'multiple_faces'
  | 'invalid_image'
  | 'quality_too_low'
  | 'processing_error'
  | 'network_error'
  | 'quota'
  | 'timeout'
  | 'unknown'

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
  /** Stable VisuTry internal campaign id only — never invent from utm_campaign. */
  campaign_id?: string
  /** External marketing name from utm_campaign when present. */
  campaign_name?: string
  merchant_id?: string
  store_id?: string
  surface?: AnalyticsSurface
  entry_point?: AnalyticsEntryPoint
  actor_type?: AnalyticsActorType
  journey_type?: AnalyticsJourneyType
  source_journey?: string
  destination?: JourneyDestination
  landing_surface?: string
  intent_type?: string
  lead_type?: StoreLeadType
  user_intent?: string
  face_shape?: string
  frame_category?: string
  failure_reason?: FaceFailureReason | string
  recommendation_count?: number
}
