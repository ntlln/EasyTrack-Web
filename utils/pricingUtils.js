import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const normalize = (value) => {
  const s = String(value || '').toLowerCase().trim()
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\bkalakhang maynila\b/g, 'metro manila')
    .replace(/\bcity\b/g, '')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim()
}

const findExactPricingMatch = (pricingList, city, region) => {
  const normCity = normalize(city)
  const normRegion = normalize(region)
  
  return pricingList.find((entry) => {
    const normEntryCity = normalize(entry.city)
    const normEntryRegion = normalize(entry.region_id?.region || '')
    return normEntryCity === normCity && normEntryRegion === normRegion
  }) || null
}

export const fetchBaseDeliveryFeeForAddress = async (city, region) => {
  try {
    const supabase = createClientComponentClient()
    const { data: pricingList, error } = await supabase
      .from('pricing')
      .select('city, region_id (region), price')

    if (error) throw error

    if (!Array.isArray(pricingList) || pricingList.length === 0) {
      return { fee: 0, status: 'no_pricing' }
    }

    const matched = findExactPricingMatch(pricingList, city, region)
    if (matched) {
      const cityName = matched.city.replace(/Kalakhang Maynila/gi, 'Metro Manila')
      const regionName = matched.region_id?.region || null
      const fee = Number(matched.price) || 0
      return { fee, status: 'ok', city: cityName, region: regionName }
    }

    return { fee: 0, status: 'no_match' }
  } catch (err) {
    return { fee: 0, status: 'no_match' }
  }
}

export const fetchPricingRegions = async () => {
  try {
    const supabase = createClientComponentClient()
    const { data, error } = await supabase
      .from('pricing_region')
      .select('*')
      .order('region', { ascending: true })

    if (error) throw error
    return data || []
  } catch (err) {
    return []
  }
}

export const fetchCitiesByRegion = async (regionId) => {
  try {
    const supabase = createClientComponentClient()
    const { data, error } = await supabase
      .from('pricing')
      .select('*, region_id (region)')
      .eq('region_id', regionId)
      .order('city', { ascending: true })

    if (error) throw error
    return data || []
  } catch (err) {
    return []
  }
}

export const fetchAllPricingData = async () => {
  try {
    const supabase = createClientComponentClient()
    const { data, error } = await supabase
      .from('pricing')
      .select('*, region_id (region)')
      .order('city', { ascending: true })

    if (error) throw error
    return data || []
  } catch (err) {
    return []
  }
}
