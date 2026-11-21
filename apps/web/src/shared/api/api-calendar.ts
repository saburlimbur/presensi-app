import axios from "axios";

const AxiosApiCalendar = axios.create({
  baseURL: "https://date.nager.at",
  timeout: 5000,
});

export default AxiosApiCalendar;
