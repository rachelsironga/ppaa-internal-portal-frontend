import React from "react"


const SearchHelper = (props) => {
  return (
    <form className="app-search d-none d-lg-block">
      <div className="position-relative">
        <input
          type="text"
          className="form-control"
          placeholder={props.t("Search") + "..."}
        />
        <span className="bx bx-search-alt" />
      </div>
    </form>
  );
}