import PropTypes from "prop-types"
import React from "react"
import { Card, CardBody, Col } from "reactstrap"
import { Link } from "react-router-dom"
import { Table, Tbody, Th, Thead, Tr } from "react-super-responsive-table"

const SHIMMER_ANIMATION = `
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
`

const TableRowPlaceholder = ({ columns }) => (
  <Tr className="placeholder-glow">
    {columns.map((width, index) => (
      <Th 
        key={index} 
        className={`placeholder col-${width}`}
        style={{
          height: "2.5rem",
          borderRadius: "4px",
          background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
          backgroundSize: "1000px 100%",
          animation: "shimmer 2s infinite linear"
        }}
      ></Th>
    ))}
  </Tr>
)

const TextRowPlaceholder = () => (
  <div className="py-2">
    <h5 className="card-title placeholder-glow mb-3">
      <span 
        className="placeholder col-6"
        style={{
          height: "1.5rem",
          borderRadius: "4px",
          background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
          backgroundSize: "1000px 100%",
          animation: "shimmer 2s infinite linear"
        }}
      ></span>
    </h5>
    <p className="card-text placeholder-glow d-flex flex-column gap-2">
      {[7, 4, 4, 6, 8].map((width, index) => (
        <span 
          key={index}
          className={`placeholder col-${width}`}
          style={{
            height: "1rem",
            borderRadius: "4px",
            background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
            backgroundSize: "1000px 100%",
            animation: "shimmer 2s infinite linear"
          }}
        ></span>
      ))}
    </p>
  </div>
)

const PLACEHOLDER_COLUMNS = [
  [2, 3, 7],
  [3, 2, 7],
  [7, 3, 2],
]

const PlaceHolderLoader = ({ columSize, rows = 1, buttonShown = false, type = "rows", className = "" }) => {
  const renderPlaceholders = () => {
    const data = []
    for (let i = 0; i < rows; i++) {
      if (type === "rows") {
        data.push(<TextRowPlaceholder key={i} />)
      } else if (type === "table") {
        data.push(
          <div key={i}>
            <Table className="table table-striped">
              <Thead>
                <TableRowPlaceholder columns={PLACEHOLDER_COLUMNS[0]} />
              </Thead>
              <Tbody>
                {PLACEHOLDER_COLUMNS.map((columns, index) => (
                  <React.Fragment key={index}>
                    <Tr>
                      <Th colSpan="3"></Th>
                    </Tr>
                    <TableRowPlaceholder columns={columns} />
                  </React.Fragment>
                ))}
              </Tbody>
            </Table>
          </div>
        )
      }
    }
    return data
  }

  return (
    <>
      <style>{SHIMMER_ANIMATION}</style>
      <Col lg={columSize}>
        <Card 
          className={`shadow-sm border-0 mb-0 ${className}`} 
          aria-hidden="true" 
          style={{
            marginTop: '1rem',
            borderRadius: '8px',
            backgroundColor: '#ffffff'
          }}
        >
          <CardBody className="p-4">
            {renderPlaceholders()}
            {buttonShown && (
              <div className="mt-4">
                <Link
                  to="#"
                  className="btn btn-primary disabled placeholder col-2"
                  style={{
                    height: "2.5rem",
                    borderRadius: "6px",
                    background: "linear-gradient(90deg, #e3e9ff 25%, #d1dcff 50%, #e3e9ff 75%)",
                    backgroundSize: "1000px 100%",
                    animation: "shimmer 2s infinite linear"
                  }}
                ></Link>
              </div>
            )}
          </CardBody>
        </Card>
      </Col>
    </>
  )
}

PlaceHolderLoader.propTypes = {
  columSize: PropTypes.number.isRequired,
  buttonShown: PropTypes.bool,
  type: PropTypes.oneOf(["table", "rows"]),
  rows: PropTypes.oneOf([1, 2, 3, 4, 5]),
  className: PropTypes.string
}

export default PlaceHolderLoader
