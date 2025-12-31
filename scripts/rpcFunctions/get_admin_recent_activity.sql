-- ============================================================
-- RPC Function: get_admin_recent_activity
-- Used by: GET /api/admin/recent-activity
-- ============================================================
-- Returns recent activity records for admin dashboard
-- Includes: document uploads, product additions, pharmacy registrations
-- Supports filtering by activity type and pagination
-- ============================================================

DROP FUNCTION IF EXISTS get_admin_recent_activity(TEXT, INTEGER, INTEGER, UUID);

CREATE OR REPLACE FUNCTION get_admin_recent_activity(
    p_activity_type TEXT DEFAULT NULL,  -- Filter by activity type (null = all)
    p_limit INTEGER DEFAULT 20,          -- Number of records to return
    p_offset INTEGER DEFAULT 0,          -- Offset for pagination
    p_pharmacy_id UUID DEFAULT NULL      -- Filter by specific pharmacy (null = all)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_activities JSONB;
    v_total_count INTEGER;
    v_today_count INTEGER;
    v_this_week_count INTEGER;
BEGIN
    -- ============================================================
    -- Get total count (with filters)
    -- ============================================================
    SELECT COUNT(*)::INTEGER
    INTO v_total_count
    FROM admin_recent_activity a
    WHERE (p_activity_type IS NULL OR a.activity_type = p_activity_type)
    AND (p_pharmacy_id IS NULL OR a.pharmacy_id = p_pharmacy_id);

    -- ============================================================
    -- Get today's activity count
    -- ============================================================
    SELECT COUNT(*)::INTEGER
    INTO v_today_count
    FROM admin_recent_activity a
    WHERE a.created_at >= DATE_TRUNC('day', NOW())
    AND (p_activity_type IS NULL OR a.activity_type = p_activity_type)
    AND (p_pharmacy_id IS NULL OR a.pharmacy_id = p_pharmacy_id);

    -- ============================================================
    -- Get this week's activity count
    -- ============================================================
    SELECT COUNT(*)::INTEGER
    INTO v_this_week_count
    FROM admin_recent_activity a
    WHERE a.created_at >= DATE_TRUNC('week', NOW())
    AND (p_activity_type IS NULL OR a.activity_type = p_activity_type)
    AND (p_pharmacy_id IS NULL OR a.pharmacy_id = p_pharmacy_id);

    -- ============================================================
    -- Get activities with pharmacy info
    -- ============================================================
    SELECT COALESCE(jsonb_agg(activity_data ORDER BY activity_data->>'created_at' DESC), '[]'::JSONB)
    INTO v_activities
    FROM (
        SELECT jsonb_build_object(
            'id', a.id,
            'activityType', a.activity_type,
            'entityId', a.entity_id,
            'entityName', a.entity_name,
            'metadata', a.metadata,
            'createdAt', a.created_at,
            'pharmacy', jsonb_build_object(
                'id', p.id,
                'name', p.name,
                'pharmacyName', p.pharmacy_name,
                'email', p.email
            )
        ) as activity_data
        FROM admin_recent_activity a
        INNER JOIN pharmacy p ON a.pharmacy_id = p.id
        WHERE (p_activity_type IS NULL OR a.activity_type = p_activity_type)
        AND (p_pharmacy_id IS NULL OR a.pharmacy_id = p_pharmacy_id)
        ORDER BY a.created_at DESC
        LIMIT p_limit
        OFFSET p_offset
    ) sub;

    -- ============================================================
    -- Build final result
    -- ============================================================
    v_result := jsonb_build_object(
        'activities', v_activities,
        'pagination', jsonb_build_object(
            'total', v_total_count,
            'limit', p_limit,
            'offset', p_offset,
            'hasMore', (p_offset + p_limit) < v_total_count
        ),
        'stats', jsonb_build_object(
            'todayCount', v_today_count,
            'thisWeekCount', v_this_week_count,
            'totalCount', v_total_count
        ),
        'filters', jsonb_build_object(
            'activityType', p_activity_type,
            'pharmacyId', p_pharmacy_id
        ),
        'generatedAt', NOW()
    );

    RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_admin_recent_activity(TEXT, INTEGER, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_recent_activity(TEXT, INTEGER, INTEGER, UUID) TO service_role;

-- ============================================================
-- Example usage:
-- ============================================================
-- Get all recent activities (default 20, no filters):
-- SELECT get_admin_recent_activity();
--
-- Get only document uploads:
-- SELECT get_admin_recent_activity('document_uploaded');
--
-- Get only product additions:
-- SELECT get_admin_recent_activity('product_added');
--
-- Get only pharmacy registrations:
-- SELECT get_admin_recent_activity('pharmacy_registered');
--
-- Get with pagination (page 2, 10 items per page):
-- SELECT get_admin_recent_activity(NULL, 10, 10);
--
-- Get activities for specific pharmacy:
-- SELECT get_admin_recent_activity(NULL, 20, 0, '3e19f01d-511d-421f-9cc6-ed83d33e034d'::UUID);
--
-- Get document uploads for specific pharmacy:
-- SELECT get_admin_recent_activity('document_uploaded', 20, 0, '3e19f01d-511d-421f-9cc6-ed83d33e034d'::UUID);
-- ============================================================

