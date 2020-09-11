import React, { Component } from "react";
import Loading from "components/Loading";
import Panel from "components/Panel";

import classnames from "classnames";

import axios from "axios";

import {
  getTotalInterviews,
  getLeastPopularTimeSlot,
  getMostPopularDay,
  getInterviewsPerDay,
} from "helpers/selectors";
import { setInterview } from "helpers/reducers";

// MOCK DATA
const data = [
  {
    id: 1,
    label: "Total Interviews",
    getValue: getTotalInterviews,
  },
  {
    id: 2,
    label: "Least Popular Time Slot",
    getValue: getLeastPopularTimeSlot,
  },
  {
    id: 3,
    label: "Most Popular Day",
    getValue: getMostPopularDay,
  },
  {
    id: 4,
    label: "Interviews Per Day",
    getValue: getInterviewsPerDay,
  },
];

class Dashboard extends Component {
  state = {
    loading: true,
    focused: null,
    days: [],
    appointments: {},
    interviewers: {},
  };

  selectPanel(id) {
    this.setState((prevState) => ({
      focused: prevState.focused !== null ? null : id,
    }));
  }

  // COMPONENT LIFECYCLE ===============================================

  // # 1
  componentDidMount() {
    const focused = JSON.parse(localStorage.getItem("focused"));
    if (focused) {
      this.setState({ focused });
    }

    Promise.all([
      axios.get("api/days"),
      axios.get("api/appointments"),
      axios.get("api/interviewers"),
    ]).then(([days, appointments, interviewers]) => {
      this.setState({
        loading: false,
        days: days.data,
        appointments: appointments.data,
        interviewers: interviewers.data,
      });
    });

    this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);

    this.socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      console.log("data from Websocket", data);

      if (typeof data === "object" && data.type === "SET_INTERVIEW") {
        this.setState((prevState) =>
          setInterview(prevState, data.id, data.interview)
        );
      }
    };
  }

  // # 2
  componentDidUpdate(prevProps, prevState) {
    if (prevState.focused !== this.state.focused) {
      localStorage.setItem("focused", JSON.stringify(this.state.focused));
    }
  }

  // # 3
  componentWillUnmount() {
    this.socket.close();
  }

  render() {
    const dashboardClasses = classnames("dashboard", {
      "dashboard--focused": this.state.focused,
    });

    if (this.state.loading) {
      return <Loading />;
    }
    console.log("new render");

    return (
      <main className={dashboardClasses}>
        {data
          .filter(
            (panel) =>
              this.state.focused === null || this.state.focused === panel.id
          )
          .map((item) => {
            return (
              <Panel
                key={item.id}
                label={item.label}
                value={item.getValue(this.state)}
                // onSelect={this.selectPanel}
                onSelect={(e) => this.selectPanel(item.id)}
              />
            );
          })}
      </main>
    );
  }
}

export default Dashboard;
