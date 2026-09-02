import React, { useState, useEffect } from "react";
import { Award, Search, FileCheck, Calendar, User, GraduationCap, CheckCircle2 } from "lucide-react";
import { resultService } from "../../services/resultService";
import { useToast } from "../../context/ToastContext";
import { PrimaryButton } from "../../components/common/PrimaryButton";
import { ResultMarksheet, ResultCard } from "../../components/results/ResultMarksheet";
import { SkeletonLoader, EmptyState } from "../../components/common/EmptyState";

export const ResultsPage = () => {
  const [activeTab, setActiveTab] = useState("search"); // 'search' | 'my-results'
  const { showError } = useToast();

  const [board, setBoard] = useState("CBSE");
  const [rollNumber, setRollNumber] = useState("1024501");
  const [dob, setDob] = useState("2009-08-15");
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);

  const [myResults, setMyResults] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setHistoryLoading(true);
        const data = await resultService.getMyResults();
        setMyResults(data);
      } catch (err) {
        console.error("History load error:", err);
      } finally {
        setHistoryLoading(false);
      }
    };
    loadHistory();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!rollNumber.trim()) {
      showError("Please enter your examination Roll Number.");
      return;
    }

    try {
      setLoading(true);
      const data = await resultService.searchResult(board, rollNumber, dob);
      setSearchResult(data);
    } catch (err) {
      showError(err.message || "Result not found.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistoricalResult = async (item) => {
    setLoading(true);
    setActiveTab("search");
    setRollNumber(item.rollNumber);
    const data = await resultService.searchResult(item.board, item.rollNumber, "2009-08-15");
    setSearchResult(data);
    setLoading(false);
  };

  return (
    <div className="space-y-3.5 sm:space-y-4 max-w-3xl w-full mx-auto box-border">
      {/* Top Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-extrabold text-[#0A1D3F] tracking-tight">
          Examination Results
        </h1>
        <p className="text-xs text-[#667085] mt-0.5">
          Search, download, and print official board examination marksheets
        </p>
      </div>

      {/* Responsive Segmented Tabs */}
      <div className="grid grid-cols-2 w-full p-1 bg-[#EAECF0] rounded-xl gap-1 box-border">
        <button
          onClick={() => setActiveTab("search")}
          className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-w-0 ${
            activeTab === "search"
              ? "bg-white text-[#0A1D3F] shadow-xs"
              : "text-[#667085] hover:text-[#0A1D3F]"
          }`}
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Result Search</span>
        </button>

        <button
          onClick={() => setActiveTab("my-results")}
          className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-w-0 ${
            activeTab === "my-results"
              ? "bg-white text-[#0A1D3F] shadow-xs"
              : "text-[#667085] hover:text-[#0A1D3F]"
          }`}
        >
          <FileCheck className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">History</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] shrink-0 ${
              activeTab === "my-results"
                ? "bg-[#FF8A00] text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {myResults.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Board Result Search or Marksheet View */}
      {activeTab === "search" ? (
        searchResult ? (
          <ResultMarksheet
            result={searchResult}
            onBack={() => setSearchResult(null)}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-[#E6E8EC] p-4 sm:p-6 shadow-xs space-y-4">
            {/* Visual Header */}
            <div className="text-center space-y-1 max-w-sm mx-auto">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-[#0A1D3F] mx-auto shadow-inner text-lg">
                📜
              </div>

              <h2 className="text-base font-extrabold text-[#0A1D3F] tracking-tight">
                Check Your Result
              </h2>
              <p className="text-[11px] text-[#667085]">
                Enter your official board exam details to view and download your marksheet.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSearch} className="max-w-md mx-auto space-y-3">
              {/* Select Board */}
              <div>
                <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                  Examination Board
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <select
                    value={board}
                    onChange={(e) => setBoard(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:ring-1 focus:ring-[#0A1D3F]"
                  >
                    <option value="CBSE">Central Board of Secondary Education (CBSE)</option>
                    <option value="ICSE">Council for the Indian School Certificate (ICSE)</option>
                    <option value="State Board">State Board Examination Council</option>
                  </select>
                </div>
              </div>

              {/* Roll Number */}
              <div>
                <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                  Examination Roll Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="e.g. 1024501"
                    className="w-full pl-9 pr-3 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs sm:text-sm font-mono font-bold text-[#0A1D3F] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0A1D3F]"
                    required
                  />
                </div>
                <p className="text-[10px] text-[#667085] mt-0.5">
                  💡 Hint: Enter <strong>1024501</strong> or <strong>1024502</strong> for instant sample results.
                </p>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:ring-1 focus:ring-[#0A1D3F]"
                    required
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <PrimaryButton
                  type="submit"
                  variant="navy"
                  size="md"
                  fullWidth
                  loading={loading}
                  icon={Search}
                >
                  View Marksheet
                </PrimaryButton>
              </div>
            </form>
          </div>
        )
      ) : (
        /* Tab 2: My Results History */
        <div className="space-y-2.5">
          {historyLoading ? (
            <SkeletonLoader type="card" count={2} />
          ) : myResults.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No Result History Found"
              description="Your examination results will appear here once published."
            />
          ) : (
            <div className="space-y-2.5">
              {myResults.map((item) => (
                <ResultCard
                  key={item.id}
                  item={item}
                  onView={() => handleViewHistoricalResult(item)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
