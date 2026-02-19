import os
import math
import pandas as pd
from fastapi import APIRouter

router = APIRouter()

# Letter labels A–F mapped to index
PROPERTY_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

MOCK_PROPERTIES = [
    {
        "id": 1,
        "propertyId": "A",
        "imageUrl": "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop",
        "roofImageUrl": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
        "submission_channel": "Broker",
        "occupancy_type": "Owner Occupied",
        "property_age": 18,
        "property_value": 850000,
        "property_county": "Orange County",
        "cover_type": "Comprehensive",
        "building_coverage_limit": 600000,
        "contents_coverage_limit": 150000,
        "broker_company": "ABC Insurance",
        "construction_risk": "Medium",
        "state": "CA",
    },
    {
        "id": 2,
        "propertyId": "B",
        "imageUrl": "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop",
        "roofImageUrl": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=600&fit=crop",
        "submission_channel": "Direct",
        "occupancy_type": "Tenant Occupied",
        "property_age": 25,
        "property_value": 620000,
        "property_county": "Los Angeles County",
        "cover_type": "Basic",
        "building_coverage_limit": 450000,
        "contents_coverage_limit": 100000,
        "broker_company": "Direct Underwriting",
        "construction_risk": "High",
        "state": "CA",
    },
    {
        "id": 3,
        "propertyId": "C",
        "imageUrl": "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
        "roofImageUrl": "https://images.unsplash.com/photo-1622021142947-da7dedc7c39a?w=800&h=600&fit=crop",
        "submission_channel": "Broker",
        "occupancy_type": "Owner Occupied",
        "property_age": 5,
        "property_value": 1200000,
        "property_county": "San Diego County",
        "cover_type": "Premium",
        "building_coverage_limit": 900000,
        "contents_coverage_limit": 250000,
        "broker_company": "XYZ Brokers",
        "construction_risk": "Low",
        "state": "CA",
    },
    {
        "id": 4,
        "propertyId": "D",
        "imageUrl": "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop",
        "roofImageUrl": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop",
        "submission_channel": "Broker",
        "occupancy_type": "Vacation Home",
        "property_age": 35,
        "property_value": 450000,
        "property_county": "Riverside County",
        "cover_type": "Comprehensive",
        "building_coverage_limit": 350000,
        "contents_coverage_limit": 75000,
        "broker_company": "Coastal Insurance Group",
        "construction_risk": "High",
        "state": "CA",
    },
    {
        "id": 5,
        "propertyId": "E",
        "imageUrl": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
        "roofImageUrl": "https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800&h=600&fit=crop",
        "submission_channel": "Direct",
        "occupancy_type": "Owner Occupied",
        "property_age": 12,
        "property_value": 975000,
        "property_county": "Ventura County",
        "cover_type": "Comprehensive",
        "building_coverage_limit": 700000,
        "contents_coverage_limit": 200000,
        "broker_company": "Direct Underwriting",
        "construction_risk": "Low",
        "state": "CA",
    },
    {
        "id": 6,
        "propertyId": "F",
        "imageUrl": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
        "roofImageUrl": "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=800&h=600&fit=crop",
        "submission_channel": "Broker",
        "occupancy_type": "Owner Occupied",
        "property_age": 8,
        "property_value": 725000,
        "property_county": "Orange County",
        "cover_type": "Basic",
        "building_coverage_limit": 550000,
        "contents_coverage_limit": 125000,
        "broker_company": "Premier Property Insurance",
        "construction_risk": "Low",
        "state": "CA",
    },
]

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
csv_path = os.path.join(base_dir, "Test", "Property_data - AI.csv")


def _clean(value, fallback=None):
    """Return fallback if value is NaN/None, else return value."""
    if value is None:
        return fallback
    try:
        if math.isnan(float(value)):
            return fallback
    except (TypeError, ValueError):
        pass
    return value


def _normalize_sub_id(value, fallback=None):
    """Return submission_id from CSV, fall back to mock value."""
    return _clean(value, fallback)


@router.get("")
def get_properties():
    try:
        if not os.path.exists(csv_path):
            return MOCK_PROPERTIES

        df = pd.read_csv(csv_path)
        excel_records = df.to_dict(orient="records")

        merged_records = []
        for i, record in enumerate(excel_records[:6]):   # only first 6
            mock = MOCK_PROPERTIES[i % len(MOCK_PROPERTIES)]
            merged_record = {
                "id": i + 1,
                "propertyId": PROPERTY_LETTERS[i],       # always A–F
                "submission_id": _normalize_sub_id(record.get("submission_id"), mock.get("submission_id")),
                "submission_channel": _clean(record.get("submission_channel"), mock.get("submission_channel")),
                "occupancy_type": _clean(record.get("occupancy_type"), mock.get("occupancy_type")),
                "property_age": _clean(record.get("property_age"), mock.get("property_age")),
                "property_value": _clean(record.get("property_value"), mock.get("property_value")),
                "property_county": _clean(record.get("Property_county"), mock.get("property_county")),
                "cover_type": _clean(record.get("cover_type"), mock.get("cover_type")),
                "building_coverage_limit": _clean(record.get("building_coverage_limit"), mock.get("building_coverage_limit")),
                "contents_coverage_limit": _clean(record.get("contents_coverage_limit"), mock.get("contents_coverage_limit")),
                "broker_company": _clean(record.get("broker_company"), mock.get("broker_company")),
                # Visual/risk fields always from mock
                "construction_risk": mock.get("construction_risk"),
                "state": mock.get("state"),
                "imageUrl": mock.get("imageUrl"),
                "roofImageUrl": mock.get("roofImageUrl"),
            }
            merged_records.append(merged_record)

        return merged_records

    except Exception as e:
        print("Error:", e)
        return MOCK_PROPERTIES
