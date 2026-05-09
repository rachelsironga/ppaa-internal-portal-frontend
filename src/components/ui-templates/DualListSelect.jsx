import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

/**
 * Transfer list: pick one or many items with checkboxes, then use the arrows.
 * Avoids react-select multi + menuIsOpen issues where focus/highlight is mistaken for selection.
 */
const DualListSelect = ({
  leftTitle = "Available Items",
  rightTitle = "Selected Items",
  leftOptions = [],
  rightOptions = [],
  onAssign,
  onRemove,
  isLoadingLeft = false,
  isLoadingRight = false,
  clearTrigger = 0,
  searchMethod = null,
}) => {
  const [leftSearch, setLeftSearch] = useState("");
  const [onlineLeftOptions, setOnlineLeftOptions] = useState([]);
  const [loadingLeftOnline, setLoadingLeftOnline] = useState(false);
  const [checkedLeft, setCheckedLeft] = useState(() => new Set());
  const [checkedRight, setCheckedRight] = useState(() => new Set());

  const normalize = (items) =>
    (items || [])
      .map((item) => ({
        value: item.value ?? item.id ?? item.uid,
        label: String(item.label ?? item.name ?? item.code ?? ""),
      }))
      .filter((o) => o.value != null && o.value !== "");

  const optionKey = (o) => String(o.value);

  const normLeftFromProps = useMemo(
    () => normalize(leftOptions),
    [leftOptions]
  );
  const normOnline = useMemo(
    () => normalize(onlineLeftOptions),
    [onlineLeftOptions]
  );
  const normRight = useMemo(() => normalize(rightOptions), [rightOptions]);

  /**
   * 2+ chars + searchMethod: prefer inline API results (normOnline); if the parent only updates
   * `leftOptions` and returns nothing (e.g. roles modal), fall back to `normLeftFromProps`.
   */
  const leftDisplayList = useMemo(() => {
    if (searchMethod && leftSearch.trim().length >= 2) {
      if (normOnline.length > 0) return normOnline;
      return normLeftFromProps;
    }
    const q = leftSearch.trim().toLowerCase();
    if (!q) return normLeftFromProps;
    return normLeftFromProps.filter((o) =>
      o.label.toLowerCase().includes(q)
    );
  }, [searchMethod, leftSearch, normOnline, normLeftFromProps]);

  const runServerSearch = useCallback(
    async (q) => {
      if (!searchMethod || q.length < 2) {
        setOnlineLeftOptions([]);
        return;
      }
      setLoadingLeftOnline(true);
      try {
        const results = await searchMethod(q);
        setOnlineLeftOptions(Array.isArray(results) ? results : []);
      } catch {
        setOnlineLeftOptions([]);
      } finally {
        setLoadingLeftOnline(false);
      }
    },
    [searchMethod]
  );

  useEffect(() => {
    if (!searchMethod || leftSearch.trim().length < 2) {
      setOnlineLeftOptions([]);
      return;
    }
    const t = setTimeout(() => {
      runServerSearch(leftSearch.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [leftSearch, searchMethod, runServerSearch]);

  useEffect(() => {
    setCheckedLeft(new Set());
    setCheckedRight(new Set());
    setLeftSearch("");
    setOnlineLeftOptions([]);
  }, [clearTrigger]);

  const toggleLeft = (key) => {
    setCheckedLeft((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleRight = (key) => {
    setCheckedRight((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleAssign = () => {
    const picked = leftDisplayList.filter((o) => checkedLeft.has(optionKey(o)));
    if (!onAssign || picked.length === 0) return;
    onAssign(picked.map((o) => ({ value: o.value, label: o.label })));
    setCheckedLeft(new Set());
    setOnlineLeftOptions([]);
  };

  const handleRemove = () => {
    const picked = normRight.filter((o) => checkedRight.has(optionKey(o)));
    if (!onRemove || picked.length === 0) return;
    onRemove(picked.map((o) => ({ value: o.value, label: o.label })));
    setCheckedRight(new Set());
    setOnlineLeftOptions([]);
  };

  const listBoxStyle = {
    maxHeight: "320px",
    overflowY: "auto",
    border: "1px solid #dee2e6",
    borderRadius: "0.375rem",
    background: "#fff",
  };

  return (
    <div className="row">
      <div className="col-sm-5">
        <label className="fw-bold mb-2">{leftTitle}</label>
        <input
          type="search"
          className="form-control form-control-sm mb-2"
          placeholder={
            searchMethod
              ? "Filter or type 2+ characters to search…"
              : "Filter list…"
          }
          value={leftSearch}
          onChange={(e) => setLeftSearch(e.target.value)}
          autoComplete="off"
        />
        <div className="small text-muted mb-1">
          Tick one or more rows, then click the green arrow to assign.
        </div>
        <div style={listBoxStyle}>
          {(isLoadingLeft || loadingLeftOnline) && (
            <div className="p-3 text-muted small">Loading…</div>
          )}
          {!isLoadingLeft && !loadingLeftOnline && leftDisplayList.length === 0 && (
            <div className="p-3 text-muted small">No options</div>
          )}
          {!isLoadingLeft &&
            !loadingLeftOnline &&
            leftDisplayList.map((o) => {
              const key = optionKey(o);
              return (
                <label
                  key={key}
                  className="d-flex align-items-center px-3 py-2 border-bottom mb-0"
                  style={{ cursor: "pointer", userSelect: "none" }}
                >
                  <input
                    type="checkbox"
                    className="form-check-input mt-0"
                    checked={checkedLeft.has(key)}
                    onChange={() => toggleLeft(key)}
                  />
                  <span className="ms-2 text-truncate">{o.label}</span>
                </label>
              );
            })}
        </div>
      </div>

      <div className="col-sm-2 text-center d-flex flex-column justify-content-center">
        <button
          type="button"
          className="btn btn-success btn-sm mb-3"
          onClick={handleAssign}
          title="Assign checked items"
          disabled={checkedLeft.size === 0}
        >
          <i className="bx bx-right-arrow-alt" />
        </button>
        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={handleRemove}
          title="Remove checked items"
          disabled={checkedRight.size === 0}
        >
          <i className="bx bx-left-arrow-alt" />
        </button>
      </div>

      <div className="col-sm-5">
        <label className="fw-bold mb-2">{rightTitle}</label>
        <div className="small text-muted mb-1" style={{ minHeight: "1.25rem" }}>
          &nbsp;
        </div>
        <div className="small text-muted mb-1">
          Tick one or more rows, then click the red arrow to return them.
        </div>
        <div style={listBoxStyle}>
          {isLoadingRight && (
            <div className="p-3 text-muted small">Loading…</div>
          )}
          {!isLoadingRight && normRight.length === 0 && (
            <div className="p-3 text-muted small">No options</div>
          )}
          {!isLoadingRight &&
            normRight.map((o) => {
              const key = optionKey(o);
              return (
                <label
                  key={key}
                  className="d-flex align-items-center px-3 py-2 border-bottom mb-0"
                  style={{ cursor: "pointer", userSelect: "none" }}
                >
                  <input
                    type="checkbox"
                    className="form-check-input mt-0"
                    checked={checkedRight.has(key)}
                    onChange={() => toggleRight(key)}
                  />
                  <span className="ms-2 text-truncate">{o.label}</span>
                </label>
              );
            })}
        </div>
      </div>
    </div>
  );
};

DualListSelect.propTypes = {
  leftTitle: PropTypes.string,
  rightTitle: PropTypes.string,
  leftOptions: PropTypes.array.isRequired,
  rightOptions: PropTypes.array.isRequired,
  onAssign: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  isLoadingLeft: PropTypes.bool,
  isLoadingRight: PropTypes.bool,
  clearTrigger: PropTypes.number,
  searchMethod: PropTypes.func,
};

export default DualListSelect;
