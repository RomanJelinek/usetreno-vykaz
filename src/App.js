import React, { useState, useEffect, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import ReactToPrint from 'react-to-print';
import axios from 'axios';
import './App.css';

const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const years = [2022, 2023, 2024, 2025, 2026];

const date = new Date();
const month = date.getMonth();
const year = date.getFullYear();

const getDaysInMonth = (month, year) =>
  new Array(31)
    .fill('')
    .map((v, i) => new Date(year, month - 1, i + 1))
    .filter((v) => v.getMonth() === month - 1);

const fetchHolidays = async (year, month, interval) => {
  const holidays = await axios.get(
    `https://svatkyapi.cz/api/day/${year}-${('0' + month).slice(
      -2
    )}-01/interval/${interval}`
  );
  return holidays.data;
};

const App = () => {
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [selectedYear, setSelectedYear] = useState(year);
  const [fullName, setFullName] = useState('');
  const [ico, setIco] = useState('');

  const clearSignature = () => {
    sigRef.current.clear();
  };

  const daysInCurrentMonth = getDaysInMonth(selectedMonth, selectedYear);

  const prefilledCalendar = daysInCurrentMonth.map((day) => {
    const weekDay = day.getDay();
    const dayDate = day.getDate();
    const worked = Number(weekDay) === 6 || Number(weekDay) === 0 ? false : true;
    return {
      weekend: !worked,
      worked,
      workedHours: worked ? 8 : 0,
      day: dayDate,
      activity: '',
      isHoliday: false,
      holidayName: '',
    };
  });

  const [calendar, setCalendar] = useState(prefilledCalendar);
  const ref = useRef();
  const sigRef = useRef();

  useEffect(() => {
    const handleChanges = async () => {
      const calendarWithoutHolidays = [...prefilledCalendar];

      const wholeMonth = await fetchHolidays(
        selectedYear,
        selectedMonth,
        calendarWithoutHolidays.length
      );
      const holidays = await wholeMonth.filter((day) => day.isHoliday);
      const updatedCalendar = calendarWithoutHolidays.map((day) => {
        let isHolidayCheck = false;
        let holidayText = '';
        holidays.forEach((holiday) => {
          if (Number(holiday.dayNumber) === Number(day.day)) {
            isHolidayCheck = true;
            holidayText = holiday.holidayName;
          }
        });
        return {
          ...day,
          isHoliday: isHolidayCheck,
          holidayName: holidayText,
          worked: day.weekend ? false : !isHolidayCheck,
          workedHours: day.weekend || isHolidayCheck ? 0 : 8,
        };
      });
      setCalendar(updatedCalendar);
    };
    handleChanges();
  }, [selectedYear, selectedMonth, prefilledCalendar]);

  useEffect(() => {
    // fetchHolidays();
  }, []);
  const workedTotal = calendar.reduce((accumulator, object) => {
    return accumulator + object.workedHours;
  }, 0);

  const handleCalendarChange = (e, day, property) => {
    setCalendar((prev) => {
      const newState = prev.map((obj) => {
        if (obj.day === day) {
          if (property === 'worked') {
            return {
              ...obj,
              worked: !obj.worked,
              workedHours: e ? 8 : 0,
              activity: !obj ? obj.activity : '',
            };
          }
          if (property === 'activity') {
            return {
              ...obj,
              activity: e,
            };
          }
          if (property === 'workedHours') {
            return {
              ...obj,
              workedHours: Number(e),
            };
          }
        }
        return obj;
      });
      return newState;
    });
  };

  return (
    <div style={pdfWrapper}>
      <div style={frame}>
        <div style={pdf} ref={ref}>
          <div style={topSection}>
            <div style={topLeft}>
              <p>
                <b>Výkaz práce za: </b>
                {selectedMonth}/{selectedYear}
              </p>
              <p>
                <b>Jméno a příjmení:</b> {fullName}
              </p>
              <p>
                <b>IČ: </b>
                {ico}
              </p>
              <p>
                <b>Pracovník odpracoval: </b>
                {workedTotal} hodin
              </p>
            </div>
            <div style={topRight}>
              <img style={img} alt="ise-l" src="/img/useLogo.webp"></img>
              <p> {workedTotal / 8} dní</p>
            </div>
          </div>
          <div style={middleSection}>
            <table
              border="1"
              cellSpacing="0"
              cellPadding="0"
              width="85%"
              style={{
                borderCollapse: 'collapse',
                textAlign: 'center',
                margin: '0 auto',
              }}
            >
              <tr
                style={{
                  maxWidth: '500px',
                  fontSize: '12px',
                  background: '#F0F8FF',
                }}
              >
                <td style={{ width: '75px' }}>Datum</td>
                <td style={{ width: '45px' }}>Projekt</td>
                <td style={{ width: '320px', padding: '0 2px' }}>
                  Popis činnosti
                </td>
                <td style={{ maxWidth: '30px' }}>Počet hodin</td>
              </tr>
              {calendar.map((day) => {
                return (
                  <tr
                    key={day.day}
                    style={{
                      maxWidth: '500px',
                      height: '16px',
                      fontSize: '12px',
                    }}
                  >
                    <td>
                      {day.day}/{selectedMonth}/{selectedYear}
                    </td>
                    <td>UCZ</td>
                    <td style={{ padding: '0 2px' }}>{day.activity}</td>
                    <td>{day.workedHours}</td>
                  </tr>
                );
              })}
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div
              style={{ width: '200px', marginLeft: '50px', marginTop: '10px' }}
            >
              <SignatureCanvas
                penColor="black"
                maxWidth={0.8}
                minWidth={0.8}
                ref={sigRef}
                canvasProps={{
                  width: 200,
                  height: 100,
                  className: 'sigCanvas',
                }}
              />
              <div style={{ borderTop: '1px solid black', fontSize: '12px' }}>
                datum a podpis za poskytovatele
              </div>
            </div>
            <div
              style={{
                width: '200px',
                marginTop: '113px',
                marginRight: '50px',
              }}
            >
              <div style={{ borderTop: '1px solid black', fontSize: '12px' }}>
                datum a podpis za Ušetřeno.cz
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={inputs}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div>Month</div>
            <div>Year</div>
            <div>Fullname</div>
            <div>IČO</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <select
              style={{ width: '50px' }}
              name="month"
              id="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>

            <select
              style={{ width: '80px' }}
              name="year"
              id="year"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
              }}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <input type="text" onChange={(e) => setFullName(e.target.value)} />
            <input type="text" onChange={(e) => setIco(e.target.value)} />
          </div>
        </div>
        <br />
        {calendar.map((input) => {
          return (
            <div style={inputRow} key={input.day}>
              <div style={{ minWidth: '35px' }}>{input.day}.</div>
              <input
                checked={input.worked}
                type="checkbox"
                onChange={(event) =>
                  handleCalendarChange(
                    event.currentTarget.checked,
                    input.day,
                    'worked'
                  )
                }
              />
              <input
                disabled={!input.worked}
                value={input.activity}
                style={{
                  width: '400px',
                  fontSize: '12px',
                  background: input.worked
                    ? input.activity.length > 5
                      ? '#90EE90'
                      : '#FFCCCB'
                    : '',
                }}
                type="text"
                placeholder={
                  input.isHoliday
                    ? input.holidayName
                    : input.weekend
                    ? 'Víkend'
                    : ''
                }
                onChange={(event) =>
                  handleCalendarChange(
                    event.target.value,
                    input.day,
                    'activity'
                  )
                }
              />
              <input
                disabled={!input.worked}
                value={input.workedHours}
                style={{ width: '30px', fontSize: '12px' }}
                type="number"
                onChange={(event) =>
                  handleCalendarChange(
                    event.target.value,
                    input.day,
                    'workedHours'
                  )
                }
              />
            </div>
          );
        })}
        <br />
        <button onClick={clearSignature}>Clear signature</button>
        <br />
        <br />

        <ReactToPrint
          trigger={() => (
            <button
              style={{
                padding: '20px',
                color: '#f5a623',
                background: '#231a62',
                fontSize: '20px',
                borderRadius: '10px',
                cursor: 'pointer',
              }}
            >
              Print this out!
            </button>
          )}
          content={() => ref.current}
          pageStyle={` @page { size: 595px 842px; margin: 0; padding: 0; }`}
        />
      </div>
    </div>
  );
};

export default App;

const pdfWrapper = {
  display: 'flex',
  justifyContent: 'space-around',
  margin: '50px auto',
  width: '1200px',
  zoom: 1,
};
const frame = {
  border: '1px solid black',
};
const pdf = {
  width: '595px',
  height: '842px',
};
const topSection = {
  display: 'flex',
  lineHeight: '10px',
  padding: '10px 45px',
};
const middleSection = { display: 'flex' };

const topLeft = { flex: '2' };

const topRight = {
  flex: '1',
  textAlign: 'right',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
};
const img = { width: '200px' };

const inputs = {
  marginTop: '30px',
};

const inputRow = {
  display: 'flex',
  width: '330px',
  justifyContent: 'space-between',
};
