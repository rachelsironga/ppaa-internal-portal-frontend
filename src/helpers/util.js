const getSelectedDepartment = (selectedUid, listObj) => {
  if (!selectedUid || !listObj || !Array.isArray(listObj)) {
    return null;
  }
  return listObj.find(item => item.uid === selectedUid) || null;
};