# Debugging Steps for Computer Asset Maintenance & Support Tickets

## Changes Applied

### 1. **Open.jsx - Computer Detail Page**
- Added `assetUid` state to store the extracted asset UID
- Modified `handleFetchAsset()` to extract and log asset UID
- Updated all data fetching functions to use `assetUid` instead of computer `uid`
- Disabled "Add Record" and "New Ticket" buttons until `assetUid` is loaded
- Added onClick console logs to track when modals are opened

### 2. **MaintenanceModal.jsx**
- Added console logs to track when `assetUid` prop is received
- Added validation check before submission
- Added warning alert if `assetUid` is missing
- Added hidden field for asset

### 3. **SupportTicketModal.jsx**
- Added console logs to track `assetUid` and `selectedTicket` props
- Enhanced validation with detailed logging
- Added warning alert if `assetUid` is missing  
- Added hidden field for asset

## How to Debug

### Step 1: Open Browser Console
1. Navigate to a computer asset detail page
2. Open browser DevTools (F12)
3. Go to Console tab

### Step 2: Check Asset UID Extraction
Look for these console logs when the page loads:
```
Computer Data Keys: [array of keys]
Extracted Asset UID: [should be a UUID or null]
```

**Expected Result:** You should see a valid UUID for "Extracted Asset UID"

**If you see `null`:**
- The backend is NOT returning `asset_uid`, `asset.uid`, or `asset` in the computer response
- **You MUST apply the backend fix** (see BACKEND_FIX_REQUIRED.md)

### Step 3: Try Opening Maintenance Modal
1. Click on "Maintenance" tab
2. Check console for:
   ```
   MaintenanceRecordModal received assetUid: [UUID or null]
   ```

3. Try clicking "Add Record" button
4. Check console for:
   ```
   Opening maintenance modal with assetUid: [UUID or null]
   ```

**If button is disabled:**
- `assetUid` is null/undefined
- Backend is not returning the asset reference
- Apply backend fix

**If button is enabled:**
- Modal should open
- If you see warning "Asset information not loaded", `assetUid` became null somehow

### Step 4: Submit Maintenance Record
1. Fill in the form
2. Click "Save Record"
3. Check console for:
   ```
   Submitting maintenance record with values: {asset: "...", ...}
   ```

**Check the `asset` field value:**
- Should be a UUID string
- If it's empty string `""` or missing, that's the problem

**If submission fails with validation error:**
```
Validation errors: {asset: ["This field may not be null."]}
```
- The `asset` field is empty in the form values
- This means `assetUid` prop was null when modal opened

### Step 5: Try Support Ticket
Same steps as maintenance, but for support ticket modal.

Check console for:
```
SupportTicketModal received assetUid: [UUID]
Opening support ticket modal with assetUid: [UUID]
Submitting support ticket with values: {asset: "...", issue_description: "...", ...}
```

## Common Issues & Solutions

### Issue 1: `assetUid` is always null
**Cause:** Backend serializer doesn't return asset reference

**Solution:** Apply the backend fix in `BACKEND_FIX_REQUIRED.md`

Add `to_representation()` method to `ComputerSerializer`:
```python
def to_representation(self, instance):
    data = super().to_representation(instance)
    if instance.asset:
        data['asset_uid'] = str(instance.asset.uid)
        data['asset'] = str(instance.asset.uid)
        # ... map other asset fields
    return data
```

### Issue 2: Modal opens but asset field is empty
**Cause:** Race condition - modal opened before `assetUid` was set

**Solution:** The buttons are now disabled until `assetUid` is available. If they're clickable, `assetUid` should be set.

### Issue 3: Form submission sends empty asset
**Cause:** Formik `initialValues` had empty string and `enableReinitialize` didn't trigger

**Solution:** We added hidden field and validation. Also check if `assetUid` prop changes after modal opens.

## Expected Console Output (Success Case)

```
Computer Data Keys: ["uid", "asset_tag", "serial_number", "hostname", "processor", "ram_gb", ..., "asset_uid", "asset"]
Extracted Asset UID: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
MaintenanceRecordModal received assetUid: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
Opening maintenance modal with assetUid: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
Submitting maintenance record with values: {
  asset: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  maintenance_type: "preventive",
  scheduled_date: "2025-11-20",
  ...
}
```

## Expected Console Output (Failure Case - Backend Not Fixed)

```
Computer Data Keys: ["uid", "asset_tag", "serial_number", "hostname", "processor", "ram_gb", ...]
Extracted Asset UID: undefined
Asset UID not available for fetching maintenance records
```

Notice: 
- No `asset_uid` or `asset` in the keys array
- `assetUid` is undefined
- Buttons will be disabled
- Cannot create maintenance/support tickets

## Next Steps

1. **Run the application** and check browser console
2. **Share the console output** showing:
   - Computer Data Keys
   - Extracted Asset UID
   - Any error messages

3. **If assetUid is null/undefined:**
   - Backend fix is REQUIRED
   - Frontend cannot work without the backend returning asset reference
   - Follow instructions in `BACKEND_FIX_REQUIRED.md`

4. **If assetUid has a value but submission still fails:**
   - Share the full console logs from opening modal to submission
   - Check what value is being sent in the request payload
