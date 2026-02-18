// Mock data for the underwriting review application
// This data is used as fallback when API calls fail

export const mockProperties = [
  {
    id: 1,
    propertyId: 'A',
    imageUrl: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop",
    submission_channel: "Broker",
    occupancy_type: "Owner Occupied",
    property_age: 18,
    property_value: 850000,
    property_county: "Orange County",
    cover_type: "Comprehensive",
    building_coverage_limit: 600000,
    contents_coverage_limit: 150000,
    broker_company: "ABC Insurance"
  },
  {
    id: 2,
    propertyId: 'B',
    imageUrl: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop",
    submission_channel: "Direct",
    occupancy_type: "Tenant Occupied",
    property_age: 25,
    property_value: 620000,
    property_county: "Los Angeles County",
    cover_type: "Basic",
    building_coverage_limit: 450000,
    contents_coverage_limit: 100000,
    broker_company: "Direct Underwriting"
  },
  {
    id: 3,
    propertyId: 'C',
    imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
    submission_channel: "Broker",
    occupancy_type: "Owner Occupied",
    property_age: 5,
    property_value: 1200000,
    property_county: "San Diego County",
    cover_type: "Premium",
    building_coverage_limit: 900000,
    contents_coverage_limit: 250000,
    broker_company: "XYZ Brokers"
  },
  {
    id: 4,
    propertyId: 'D',
    imageUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop",
    submission_channel: "Broker",
    occupancy_type: "Vacation Home",
    property_age: 35,
    property_value: 450000,
    property_county: "Riverside County",
    cover_type: "Comprehensive",
    building_coverage_limit: 350000,
    contents_coverage_limit: 75000,
    broker_company: "Coastal Insurance Group"
  },
  {
    id: 5,
    propertyId: 'E',
    imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
    submission_channel: "Direct",
    occupancy_type: "Owner Occupied",
    property_age: 12,
    property_value: 975000,
    property_county: "Ventura County",
    cover_type: "Comprehensive",
    building_coverage_limit: 700000,
    contents_coverage_limit: 200000,
    broker_company: "Direct Underwriting"
  },
  {
    id: 6,
    propertyId: 'F',
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
    submission_channel: "Broker",
    occupancy_type: "Owner Occupied",
    property_age: 8,
    property_value: 725000,
    property_county: "Orange County",
    cover_type: "Basic",
    building_coverage_limit: 550000,
    contents_coverage_limit: 125000,
    broker_company: "Premier Property Insurance"
  }
];

export const mockDecisions = [
  {
    propertyId: 1,
    userSelection: "prioritized",
    aiPrediction: {
      risk: "Medium",
      quotePercentage: 68
    }
  },
  {
    propertyId: 2,
    userSelection: null,
    aiPrediction: {
      risk: "High",
      quotePercentage: 82
    }
  },
  {
    propertyId: 3,
    userSelection: null,
    aiPrediction: {
      risk: "Low",
      quotePercentage: 35
    }
  },
  {
    propertyId: 4,
    userSelection: "discarded",
    aiPrediction: {
      risk: "High",
      quotePercentage: 77
    }
  },
  {
    propertyId: 5,
    userSelection: null,
    aiPrediction: {
      risk: "Medium",
      quotePercentage: 61
    }
  },
  {
    propertyId: 6,
    userSelection: null,
    aiPrediction: {
      risk: "Low",
      quotePercentage: 28
    }
  }
];

export const mockShapDrivers = [
  {
    feature: "Property Condition Risk",
    contribution: 0.32
  },
  {
    feature: "Wildfire Exposure",
    contribution: 0.27
  },
  {
    feature: "Roof Material (Wood)",
    contribution: 0.21
  },
  {
    feature: "Past Claim Frequency",
    contribution: 0.18
  },
  {
    feature: "Local Crime Rate",
    contribution: 0.15
  },
  {
    feature: "Building Coverage Limit",
    contribution: -0.12
  },
  {
    feature: "Annual Income",
    contribution: -0.09
  }
];
