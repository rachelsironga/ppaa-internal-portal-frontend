# Backend Fix Required for Computer Asset Module

## Issue Summary
Maintenance records and support tickets fail to create for computer assets with validation error:
**"Invalid asset reference. Provide a valid asset UID, numeric ID, or asset_tag."**

## Root Cause
The `ComputerSerializer` in Django backend integrates asset fields directly (asset_tag, barcode, serial_number, etc.) but **doesn't include the actual asset foreign key reference** (asset_uid or asset) in the serialized response.

## Current Backend Structure
- `Computer` model has a foreign key relationship to `Asset` model: `computer.asset`
- `ComputerSerializer` has a working `create()` method that creates the Asset first, then creates the Computer with the asset reference
- Maintenance records and support tickets reference **Asset objects**, not Computer objects directly

## Required Backend Fix

### Location
Find the `ComputerSerializer` in your Django backend (likely in `serializers.py` within the computer assets app).

### Add `to_representation()` Method

Add this method to `ComputerSerializer`:

```python
class ComputerSerializer(SaveWithRequestUserMixin, BaseModelSerializer):
    # ... existing field declarations ...
    
    def to_representation(self, instance):
        """
        Expose asset fields from the related Asset model and include asset UID
        for frontend operations (maintenance records, support tickets, etc.)
        """
        data = super().to_representation(instance)
        
        if instance.asset:
            # CRITICAL: Add the asset UID so frontend can reference it
            data['asset_uid'] = str(instance.asset.uid)
            data['asset'] = str(instance.asset.uid)  # For backward compatibility
            
            # Map asset fields from the related asset
            data['asset_tag'] = instance.asset.asset_tag
            data['barcode'] = instance.asset.barcode
            data['serial_number'] = instance.asset.serial_number
            data['asset_type'] = instance.asset.asset_type.uid if instance.asset.asset_type else None
            data['asset_type_name'] = instance.asset.asset_type.name if instance.asset.asset_type else None
            data['manufacturer'] = instance.asset.manufacturer.uid if instance.asset.manufacturer else None
            data['manufacturer_name'] = instance.asset.manufacturer.name if instance.asset.manufacturer else None
            data['model'] = instance.asset.model
            data['purchase_date'] = instance.asset.purchase_date
            data['purchase_cost'] = str(instance.asset.purchase_cost) if instance.asset.purchase_cost else None
            data['supplier'] = instance.asset.supplier.uid if instance.asset.supplier else None
            data['supplier_name'] = instance.asset.supplier.name if instance.asset.supplier else None
            data['status'] = instance.asset.status
            data['condition'] = instance.asset.condition
            data['location'] = instance.asset.location.uid if instance.asset.location else None
            data['location_name'] = instance.asset.location.name if instance.asset.location else None
            data['custodian'] = instance.asset.custodian.guid if instance.asset.custodian else None
            data['custodian_name'] = instance.asset.custodian.get_full_name() if instance.asset.custodian else None
            data['warranty_expiry'] = instance.asset.warranty_expiry
            data['photo'] = instance.asset.photo.url if instance.asset.photo else None
            data['is_active'] = instance.asset.is_active
            data['last_audit_date'] = instance.asset.last_audit_date
            data['notes'] = instance.asset.notes
        
        return data
    
    def update(self, instance, validated_data):
        """
        Handle updates to both Computer and Asset fields
        """
        # Extract asset fields
        asset_fields = [
            'asset_tag', 'barcode', 'serial_number', 'asset_type', 'manufacturer',
            'model', 'purchase_date', 'purchase_cost', 'supplier', 'status',
            'condition', 'location', 'custodian', 'warranty_expiry', 'photo',
            'is_active', 'last_audit_date', 'notes'
        ]
        
        asset_data = {}
        for field in asset_fields:
            if field in validated_data:
                asset_data[field] = validated_data.pop(field)
        
        # Update asset if we have asset data
        if asset_data and instance.asset:
            for key, value in asset_data.items():
                setattr(instance.asset, key, value)
            instance.asset.save()
        
        # Update computer fields
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        
        return instance
```

## Frontend Changes (Already Applied)

The frontend has been updated to:
1. Extract `asset_uid` from the computer data using fallback chain: `assetData.asset_uid || assetData.asset?.uid || assetData.asset`
2. Store the extracted `assetUid` in component state
3. Pass `assetUid` (not computer `uid`) to `MaintenanceRecordModal` and `SupportTicketModal`
4. Use `assetUid` for fetching maintenance records, support tickets, and history data

## Testing After Backend Fix

1. Navigate to a computer asset detail page
2. Check browser console for:
   - "Computer Data Keys: [...]" - should include `asset_uid`
   - "Extracted Asset UID: [uuid]" - should show a valid UUID
3. Try creating a maintenance record - should succeed
4. Try creating a support ticket - should succeed
5. Verify maintenance/support tabs load data correctly

## Additional Notes

- The `asset_uid` field is critical for frontend operations that reference the Asset model
- Without this field, maintenance records and support tickets cannot be created for computer assets
- The serializer must handle both CREATE (already working) and UPDATE operations
- Consider implementing similar fix for other asset subtype serializers (NetworkAssetSerializer, etc.)

## Files Modified in Frontend
- `src/pages/services/ICT-ASSETS/computers/Open.jsx`

## Files Requiring Backend Changes
- `serializers.py` in computer assets app (exact path depends on your Django project structure)
