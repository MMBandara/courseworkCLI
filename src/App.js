import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Styles.css";

const SimulationForm = () => {
  const [formData, setFormData] = useState({
    maximumCapacity: 20,
    retrievalRate: 1000,
    customerBuyingRate: 1000,
    vendorCount: 5,
    customerCount: 5
  });

  const [simulationLogs, setSimulationLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [logInterval, setLogInterval] = useState(null);
  const [ticketPoolSize, setTicketPoolSize] = useState(0);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: parseInt(value, 10),
    }));
    validateField(name, parseInt(value, 10));
  };

  const validateField = (name, value) => {
    let errors = { ...validationErrors };
    switch (name) {
      case "maximumCapacity":
        if (value < 1 || value > 100) {
          errors[name] = "Maximum capacity must be between 1 and 100";
        } else {
          delete errors[name];
        }
        break;
      case "retrievalRate":
      case "customerBuyingRate":
        if (value < 100 || value > 10000) {
          errors[name] = "Rate must be between 100 and 10000 milliseconds";
        } else {
          delete errors[name];
        }
        break;
      case "vendorCount":
      case "customerCount":
        if (value < 1 || value > 20) {
          errors[name] = "Count must be between 1 and 20";
        } else {
          delete errors[name];
        }
        break;
      default:
        break;
    }
    setValidationErrors(errors);
  };

  const validateForm = () => {
    let isValid = true;
    Object.keys(formData).forEach((key) => {
      validateField(key, formData[key]);
      if (validationErrors[key]) {
        isValid = false;
      }
    });
    return isValid;
  };

  const handleApiError = (error, action) => {
    console.error(`Error ${action}:`, error);
    if (error.response) {
      setError(`Error ${action}: ${error.response.data}`);
    } else if (error.request) {
      setError(`Network error: Unable to connect to the server.`);
    } else {
      setError(`Error ${action}: ${error.message}`);
    }
  };

  const configureSimulation = async () => {
    if (!validateForm()) {
      setError("Please correct the errors in the form before configuring.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8080/api/configure",
        formData
      );
      setSimulationLogs([response.data]);
      setError(null);
    } catch (error) {
      handleApiError(error, "configuring simulation");
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/logs");
      setSimulationLogs(response.data);
      setError(null);
    } catch (error) {
      handleApiError(error, "fetching logs");
    }
  };

  const fetchTicketPoolSize = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/api/ticket-pool-size"
      );
      setTicketPoolSize(response.data);
      setError(null);
    } catch (error) {
      handleApiError(error, "fetching ticket pool size");
    }
  };

  const startSimulation = async () => {
    if (!validateForm()) {
      setError("Please correct the errors in the form before starting the simulation.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:8080/api/start");
      setSimulationLogs([response.data]);
      setIsRunning(true);
      setError(null);
      const intervalId = setInterval(() => {
        fetchLogs();
        fetchTicketPoolSize();
      }, 1000);
      setLogInterval(intervalId);
    } catch (error) {
      handleApiError(error, "starting simulation");
    }
  };

  const stopSimulation = async () => {
    try {
      const response = await axios.post("http://localhost:8080/api/stop");
      setSimulationLogs([response.data]);
      setIsRunning(false);
      setError(null);
      if (logInterval) {
        clearInterval(logInterval);
        setLogInterval(null);
      }
    } catch (error) {
      handleApiError(error, "stopping simulation");
    }
  };

  useEffect(() => {
    return () => {
      if (logInterval) {
        clearInterval(logInterval);
      }
    };
  }, [logInterval]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "white",
        color: "black",
        fontFamily: "sans-serif",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "2rem" }}>
        Ticket System Simulation
      </h1>
      <div className="content"
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexGrow: 1,
        }}
      >
        <div style={{ width: "40%", gap: "1rem", display: "flex", flexDirection: "column" }}>
          {Object.entries(formData).map(([field, value]) => (
            <div key={field} style={{ marginBottom: "1rem" }}>
              <label
                htmlFor={field}
                style={{ display: "block", fontSize: "16px", marginBottom: "0.5rem" }}
              >
                {field.replace(/([A-Z])/g, " $1")}
              </label>
              <input
                type="number"
                id={field}
                name={field}
                value={value}
                onChange={handleChange}
                style={{
                  width: "90%",
                  height:"30px",
                  padding: "0.5rem",
                  fontSize:"14px",
                  backgroundColor: "lightgray",
                  borderRadius: "0.375rem",
                  fontWeight:500,
                  color: "Black",
                  border: validationErrors[field] ? "2px solid #e53e3e" : "none",
                }}
                aria-invalid={validationErrors[field] ? "true" : "false"}
                aria-describedby={`${field}-error`}
              />
              {validationErrors[field] && (
                <p id={`${field}-error`} style={{ color: "#e53e3e", fontSize: "0.875rem" }}>
                  {validationErrors[field]}
                </p>
              )}
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
            <button
              onClick={startSimulation}
              disabled={isRunning || Object.keys(validationErrors).length > 0}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#38a169",
                color: "#fff",
                fontWeight: "bold",
                borderRadius: "5px",
                border:"none",
                cursor: isRunning ? "not-allowed" : "pointer",
              }}
            >
              Start
            </button>
            <button
              onClick={stopSimulation}
              disabled={!isRunning}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "red",
                color: "#fff",
                fontWeight: "bold",
                borderRadius: "5px",
                border:"none",
                cursor: !isRunning ? "not-allowed" : "pointer",
              }}
            >
              Stop
            </button>
            <button
              onClick={configureSimulation}
              disabled={Object.keys(validationErrors).length > 0}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#38a169",
                color: "#fff",
                fontWeight: "bold",
                borderRadius: "5px",
                border:"none",
                cursor: Object.keys(validationErrors).length > 0 ? "not-allowed" : "pointer",
              }}
            >
              Configure
            </button>
          </div>
        </div>
        <div style={{ width: "700px", backgroundColor: "darkgray", borderRadius: "0.375rem", padding: "1.5rem",height:"500px"}}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
            Simulation Logs
          </h2>
          {error && (
            <div
              style={{
                backgroundColor: "#e53e3e",
                color: "#fff",
                padding: "1rem",
                borderRadius: "0.375rem",
                marginBottom: "1rem",
                fontSize:"12px",
              }}
            >
              {error}
            </div>
          )}
          <div style={{ maxHeight: "90%", width:"100%", overflowY: "scroll", backgroundColor: "white", borderRadius:"10px",fontSize:"14px"}}>
            {simulationLogs.length > 0
              ? simulationLogs.map((log, index) => <p key={index}>{log}</p>)
              : "No logs available"}
          </div>
          <p style={{ marginTop: "1rem" }}>
            Ticket Pool Size: {ticketPoolSize}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimulationForm;