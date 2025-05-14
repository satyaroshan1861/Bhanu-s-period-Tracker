import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster, toast } from "sonner";
import { useState } from "react";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 to-indigo-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm p-4 flex justify-between items-center border-b border-pink-100">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-pink-500 text-transparent bg-clip-text">Bhanu's Period Tracker</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 p-8">
        <div className="w-full max-w-6xl mx-auto">
          <Content />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const cycles = useQuery(api.cycles.getMyCycles);
  const predictions = useQuery(api.cycles.getPredictions);
  const symptomStats = useQuery(api.cycles.getSymptomStats);
  const addCycle = useMutation(api.cycles.addCycle);
  
  const [startDate, setStartDate] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [flow, setFlow] = useState("");
  const [view, setView] = useState<"form" | "calendar" | "stats">("form");

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const handleAddCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addCycle({ startDate, symptoms, notes, flow });
      toast.success("Period cycle added");
      setStartDate("");
      setSymptoms([]);
      setNotes("");
      setFlow("");
    } catch (error) {
      toast.error("Failed to add cycle");
    }
  };

  const renderCalendar = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const days = [];
    
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(currentYear, currentMonth, d);
      const dateStr = date.toISOString().split('T')[0];
      const hasPeriod = cycles?.some(c => c.startDate === dateStr);
      const isPredicted = predictions?.predictions.some(p => p.date === dateStr);
      
      days.push({
        date: d,
        hasPeriod,
        isPredicted,
        isToday: date.toDateString() === today.toDateString(),
      });
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold p-2">{day}</div>
        ))}
        {Array(firstDay.getDay()).fill(null).map((_, i) => (
          <div key={`empty-${i}`} className="p-2"></div>
        ))}
        {days.map(({ date, hasPeriod, isPredicted, isToday }) => (
          <div
            key={date}
            className={`p-2 text-center rounded-lg transition-all duration-300 hover:scale-105 ${
              isToday ? 'ring-2 ring-indigo-500' : ''
            } ${hasPeriod ? 'bg-gradient-to-br from-red-100 to-pink-100' : ''} ${
              isPredicted ? 'bg-gradient-to-br from-pink-50 to-purple-50' : ''
            }`}
          >
            {date}
          </div>
        ))}
      </div>
    );
  };

  const renderStats = () => {
    if (!symptomStats) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
          <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-indigo-600 to-pink-500 text-transparent bg-clip-text">Symptom Analysis</h3>
          <div className="space-y-4">
            {symptomStats.map(({ symptom, count, percentage }) => (
              <div key={symptom} className="space-y-1">
                <div className="flex justify-between">
                  <span className="capitalize">{symptom}</span>
                  <span>{percentage}% of cycles</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-indigo-600 to-pink-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {predictions && (
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-indigo-600 to-pink-500 text-transparent bg-clip-text">Cycle Predictions</h3>
            <p className="text-gray-600 mb-4">
              Average cycle length: {predictions.averageCycleLength} days
            </p>
            <div className="space-y-2">
              {predictions.predictions.map((pred) => (
                <div key={pred.cycleNumber} className="flex justify-between p-2 rounded-lg hover:bg-pink-50 transition-colors duration-300">
                  <span>Predicted cycle #{pred.cycleNumber}</span>
                  <span>{new Date(pred.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center relative overflow-hidden py-12">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-pink-100 opacity-50"></div>
        <div className="relative">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-pink-500 text-transparent bg-clip-text mb-4 animate-fade-in">
            Period Tracker
          </h1>
          <Authenticated>
            <p className="text-xl text-slate-600 animate-slide-up">
              Welcome back, {loggedInUser?.email ?? "friend"}!
            </p>
          </Authenticated>
          <Unauthenticated>
            <p className="text-xl text-slate-600 animate-slide-up">Sign in to track your cycles</p>
          </Unauthenticated>
          <div className="mt-8 flex justify-center space-x-4">
            <img src="https://convex.dev/assets/art/build-01.svg" alt="Decoration" className="w-24 h-24 animate-float" />
            <img src="https://convex.dev/assets/art/build-02.svg" alt="Decoration" className="w-24 h-24 animate-float-delayed" />
          </div>
        </div>
      </div>

      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>

      <Authenticated>
        <div className="flex justify-center space-x-4 mb-8">
          {["form", "calendar", "stats"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v as any)}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
                view === v 
                  ? 'bg-gradient-to-r from-indigo-600 to-pink-500 text-white shadow-lg' 
                  : 'bg-white/80 hover:bg-white'
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {view === "form" && (
          <div className="max-w-2xl mx-auto space-y-8">
            <form onSubmit={handleAddCycle} className="space-y-4 bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Flow</label>
                <select
                  value={flow}
                  onChange={(e) => setFlow(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-300"
                >
                  <option value="">Select flow</option>
                  <option value="light">Light</option>
                  <option value="medium">Medium</option>
                  <option value="heavy">Heavy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Symptoms</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {["cramps", "headache", "fatigue", "bloating", "mood swings", "back pain"].map((symptom) => (
                    <label key={symptom} className="inline-flex items-center p-2 rounded-lg hover:bg-pink-50 transition-all duration-300">
                      <input
                        type="checkbox"
                        checked={symptoms.includes(symptom)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSymptoms([...symptoms, symptom]);
                          } else {
                            setSymptoms(symptoms.filter((s) => s !== symptom));
                          }
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-600 capitalize">{symptom}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-300"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-pink-500 text-white py-3 px-4 rounded-md hover:from-indigo-700 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105"
              >
                Add Cycle
              </button>
            </form>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-pink-500 text-transparent bg-clip-text">Recent Cycles</h2>
              {cycles?.slice(0, 3).map((cycle) => (
                <div
                  key={cycle._id}
                  className="border rounded-lg p-4 space-y-2 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex justify-between">
                    <p className="font-semibold">Start Date: {new Date(cycle.startDate).toLocaleDateString()}</p>
                    <p className="text-gray-600">Flow: {cycle.flow}</p>
                  </div>
                  {cycle.symptoms && cycle.symptoms.length > 0 && (
                    <p>Symptoms: {cycle.symptoms.join(", ")}</p>
                  )}
                  {cycle.notes && <p className="text-gray-600">{cycle.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "calendar" && (
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-pink-500 text-transparent bg-clip-text">
                {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gradient-to-br from-red-100 to-pink-100 rounded-full mr-1"></div>
                  <span>Period</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gradient-to-br from-pink-50 to-purple-50 rounded-full mr-1"></div>
                  <span>Predicted</span>
                </div>
              </div>
            </div>
            {renderCalendar()}
          </div>
        )}

        {view === "stats" && renderStats()}
      </Authenticated>
    </div>
  );
}
