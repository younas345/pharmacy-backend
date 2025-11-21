import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/appError';

export interface ReverseDistributor {
  id: string;
  name: string;
  code: string;
  contact_email?: string;
  contact_phone?: string;
  address?: any;
  portal_url?: string;
  supported_formats?: string[];
  is_active: boolean;
  created_at: string;
}

export interface ReverseDistributorInfo {
  name?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    [key: string]: any;
  };
  portalUrl?: string;
  supportedFormats?: string[];
}

/**
 * Find or create a reverse distributor by name and update with provided information
 * Returns the distributor ID
 */
export const findOrCreateReverseDistributor = async (
  name: string,
  distributorInfo?: ReverseDistributorInfo
): Promise<string> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  if (!name || name.trim() === '') {
    throw new AppError('Distributor name is required', 400);
  }

  const db = supabaseAdmin;
  const trimmedName = name.trim();

  // Try to find existing distributor by name (case-insensitive)
  const { data: existing } = await db
    .from('reverse_distributors')
    .select('*')
    .ilike('name', trimmedName)
    .limit(1)
    .single();

  if (existing) {
    console.log('✅ Found existing reverse distributor:', existing.id, trimmedName);
    
    // Update existing distributor with new information if provided
    if (distributorInfo) {
      const updateData: any = {};
      
      // Only update fields that are provided and not already set (or if new info is more complete)
      if (distributorInfo.contactEmail && (!existing.contact_email || existing.contact_email.trim() === '')) {
        updateData.contact_email = distributorInfo.contactEmail;
        console.log('   📧 Will update email:', distributorInfo.contactEmail);
      }
      if (distributorInfo.contactPhone && (!existing.contact_phone || existing.contact_phone.trim() === '')) {
        updateData.contact_phone = distributorInfo.contactPhone;
        console.log('   📞 Will update phone:', distributorInfo.contactPhone);
      }
      if (distributorInfo.address) {
        // Merge address data
        const existingAddress = existing.address || {};
        updateData.address = {
          ...existingAddress,
          ...distributorInfo.address,
        };
        console.log('   📍 Will update address:', JSON.stringify(updateData.address));
      }
      if (distributorInfo.portalUrl && (!existing.portal_url || existing.portal_url.trim() === '')) {
        updateData.portal_url = distributorInfo.portalUrl;
        console.log('   🌐 Will update portal URL:', distributorInfo.portalUrl);
      }
      if (distributorInfo.supportedFormats && (!existing.supported_formats || existing.supported_formats.length === 0)) {
        updateData.supported_formats = distributorInfo.supportedFormats;
        console.log('   📄 Will update supported formats:', distributorInfo.supportedFormats);
      }
      
      // Update if there's any new information
      if (Object.keys(updateData).length > 0) {
        console.log('💾 Updating distributor with fields:', Object.keys(updateData));
        const { error: updateError } = await db
          .from('reverse_distributors')
          .update(updateData)
          .eq('id', existing.id);
        
        if (updateError) {
          console.warn('⚠️ Failed to update distributor info:', updateError.message);
        } else {
          console.log('✅ Successfully updated reverse distributor with new information');
        }
      } else {
        console.log('ℹ️ No new information to update (all fields already populated)');
      }
    }
    
    return existing.id;
  }

  // Create new distributor
  // Generate code from name (first 3 uppercase letters, or first letters of words)
  const code = generateDistributorCode(trimmedName);

  console.log('➕ Creating new reverse distributor:', trimmedName, 'Code:', code);

  // Prepare insert data
  const insertData: any = {
    name: trimmedName,
    code: code,
    is_active: true,
  };

  // Add distributor info if provided
  if (distributorInfo) {
    if (distributorInfo.contactEmail) {
      insertData.contact_email = distributorInfo.contactEmail;
      console.log('   📧 Adding email:', distributorInfo.contactEmail);
    }
    if (distributorInfo.contactPhone) {
      insertData.contact_phone = distributorInfo.contactPhone;
      console.log('   📞 Adding phone:', distributorInfo.contactPhone);
    }
    if (distributorInfo.address) {
      insertData.address = distributorInfo.address;
      console.log('   📍 Adding address:', JSON.stringify(distributorInfo.address));
    }
    if (distributorInfo.portalUrl) {
      insertData.portal_url = distributorInfo.portalUrl;
      console.log('   🌐 Adding portal URL:', distributorInfo.portalUrl);
    }
    if (distributorInfo.supportedFormats) {
      insertData.supported_formats = distributorInfo.supportedFormats;
      console.log('   📄 Adding supported formats:', distributorInfo.supportedFormats);
    }
  }
  
  console.log('💾 Inserting distributor with data:', JSON.stringify(insertData, null, 2));

  const { data: newDistributor, error } = await db
    .from('reverse_distributors')
    .insert(insertData)
    .select('id')
    .single();

  if (error) {
    // If code conflict, try with timestamp
    if (error.code === '23505') { // Unique violation
      const codeWithTimestamp = `${code}_${Date.now().toString().slice(-6)}`;
      insertData.code = codeWithTimestamp;
      
      const { data: retryDistributor, error: retryError } = await db
        .from('reverse_distributors')
        .insert(insertData)
        .select('id')
        .single();

      if (retryError) {
        throw new AppError(`Failed to create reverse distributor: ${retryError.message}`, 400);
      }

      console.log('✅ Created reverse distributor with unique code:', retryDistributor.id);
      return retryDistributor.id;
    }

    throw new AppError(`Failed to create reverse distributor: ${error.message}`, 400);
  }

  console.log('✅ Created new reverse distributor:', newDistributor.id);
  return newDistributor.id;
};

/**
 * Generate a code from distributor name
 */
const generateDistributorCode = (name: string): string => {
  // Remove common words
  const words = name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => 
      !['INC', 'LLC', 'CORP', 'LTD', 'COMPANY', 'CO', 'PHARMA', 'PHARMACEUTICAL', 'DISTRIBUTORS', 'DISTRIBUTOR', 'SERVICES', 'SOLUTIONS'].includes(word)
    );

  if (words.length === 0) {
    // Fallback: use first 3 letters of name
    return name.replace(/[^A-Z0-9]/g, '').substring(0, 3).toUpperCase() || 'DIST';
  }

  if (words.length === 1) {
    return words[0].substring(0, 3).toUpperCase();
  }

  // Use first letter of first 3 words, or first 3 letters of first word
  if (words.length >= 3) {
    return words.slice(0, 3).map(w => w[0]).join('').toUpperCase();
  }

  return words.map(w => w[0]).join('').toUpperCase() + words[0].substring(1, 3).toUpperCase();
};

/**
 * Get all reverse distributors
 */
export const getReverseDistributors = async (): Promise<ReverseDistributor[]> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  const { data, error } = await db
    .from('reverse_distributors')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    throw new AppError(`Failed to fetch reverse distributors: ${error.message}`, 400);
  }

  return data || [];
};

/**
 * Get reverse distributor by ID
 */
export const getReverseDistributorById = async (id: string): Promise<ReverseDistributor | null> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  const { data, error } = await db
    .from('reverse_distributors')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // Not found
      return null;
    }
    throw new AppError(`Failed to fetch reverse distributor: ${error.message}`, 400);
  }

  return data;
};

export interface TopDistributor {
  id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  location?: string; // City, State format
  active: boolean; // false if pharmacy has document with report_date within last 30 days
  documentCount?: number; // Number of documents uploaded
  totalCreditAmount?: number; // Total credit amount processed
  lastActivityDate?: string; // Most recent report_date
}

/**
 * Get top distributors for a pharmacy
 * Rankings based on: document count, total credit amount, and recent activity
 * Active status: false if pharmacy has any document with report_date within last 30 days, true otherwise
 */
export const getTopDistributors = async (pharmacyId: string): Promise<TopDistributor[]> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  if (!pharmacyId) {
    throw new AppError('Pharmacy ID is required', 400);
  }

  const db = supabaseAdmin;

  // Get all active distributors
  const { data: distributors, error: distError } = await db
    .from('reverse_distributors')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (distError) {
    throw new AppError(`Failed to fetch distributors: ${distError.message}`, 400);
  }

  if (!distributors || distributors.length === 0) {
    return [];
  }

  // Calculate date 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  // Process each distributor - get last document for each pharmacy-distributor combination
  const distributorStats: Map<string, {
    documentCount: number;
    totalCreditAmount: number;
    lastActivityDate: string | null;
    hasRecentActivity: boolean; // Last document's report_date is within last 30 days
  }> = new Map();

  // Initialize all distributors
  distributors.forEach((dist) => {
    distributorStats.set(dist.id, {
      documentCount: 0,
      totalCreditAmount: 0,
      lastActivityDate: null,
      hasRecentActivity: false,
    });
  });

  // For each distributor, get the last uploaded document for this pharmacy
  for (const dist of distributors) {
    // Get the most recent document for this pharmacy and distributor (by report_date)
    const { data: lastDocument, error: docError } = await db
      .from('uploaded_documents')
      .select('id, report_date, total_credit_amount, uploaded_at')
      .eq('pharmacy_id', pharmacyId)
      .eq('reverse_distributor_id', dist.id)
      .not('report_date', 'is', null)
      .order('report_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (docError) {
      console.warn(`⚠️ Error fetching last document for distributor ${dist.id}:`, docError.message);
      continue;
    }

    const stats = distributorStats.get(dist.id)!;

    if (lastDocument && lastDocument.report_date) {
      const reportDate = new Date(lastDocument.report_date);
      const reportDateStr = reportDate.toISOString().split('T')[0];
      
      stats.lastActivityDate = reportDateStr;
      stats.totalCreditAmount = Number(lastDocument.total_credit_amount || 0);

      // Check if the last document's report_date is within last 30 days
      if (reportDateStr >= thirtyDaysAgoStr) {
        stats.hasRecentActivity = true;
      }
    }

    // Get total document count and total credit amount for this distributor
    const { data: allDocuments, error: countError } = await db
      .from('uploaded_documents')
      .select('id, total_credit_amount')
      .eq('pharmacy_id', pharmacyId)
      .eq('reverse_distributor_id', dist.id);

    if (!countError && allDocuments) {
      stats.documentCount = allDocuments.length;
      // Recalculate total credit amount from all documents
      stats.totalCreditAmount = allDocuments.reduce((sum, doc) => {
        return sum + Number(doc.total_credit_amount || 0);
      }, 0);
    }
  }

  // Build result array
  const topDistributors: TopDistributor[] = distributors.map((dist) => {
    const stats = distributorStats.get(dist.id)!;
    
    // Format location from address - combine all components into one string
    let location: string | undefined;
    if (dist.address) {
      const addr = dist.address;
      const locationParts: string[] = [];
      
      // Add street if available
      if (addr.street) {
        locationParts.push(addr.street);
      }
      
      // Add city if available
      if (addr.city) {
        locationParts.push(addr.city);
      }
      
      // Add state if available
      if (addr.state) {
        locationParts.push(addr.state);
      }
      
      // Add zipCode if available
      if (addr.zipCode) {
        locationParts.push(addr.zipCode);
      }
      
      // Add country if available
      if (addr.country) {
        locationParts.push(addr.country);
      }
      
      // Combine all parts with comma and space
      if (locationParts.length > 0) {
        location = locationParts.join(', ');
      }
    }

    return {
      id: dist.id,
      name: dist.name,
      code: dist.code,
      email: dist.contact_email || undefined,
      phone: dist.contact_phone || undefined,
      location,
      active: !stats.hasRecentActivity, // false if has recent activity (within 30 days)
      documentCount: stats.documentCount,
      totalCreditAmount: Math.round(stats.totalCreditAmount * 100) / 100,
      lastActivityDate: stats.lastActivityDate || undefined,
    };
  });

  // Sort by: document count (desc), total credit amount (desc), then by name (asc)
  topDistributors.sort((a, b) => {
    // First by document count
    if (b.documentCount! !== a.documentCount!) {
      return b.documentCount! - a.documentCount!;
    }
    // Then by total credit amount
    if (b.totalCreditAmount! !== a.totalCreditAmount!) {
      return b.totalCreditAmount! - a.totalCreditAmount!;
    }
    // Finally by name
    return a.name.localeCompare(b.name);
  });

  return topDistributors;
};

