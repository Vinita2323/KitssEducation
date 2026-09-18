import React, { useState, useEffect } from "react";
import { Search, FileCheck, ArrowLeft, RotateCcw, GraduationCap, Building2 } from "lucide-react";
import { resultService, ResultNotFoundError } from "../../services/resultService";
import { useToast } from "../../context/ToastContext";
import { ResultTypeSelector } from "../../components/results/ResultTypeSelector";
import { BoardSelector } from "../../components/results/BoardSelector";
import { ResultSearchForm } from "../../components/results/ResultSearchForm";
import { ResultLoading } from "../../components/results/ResultLoading";
import { ResultNotFound } from "../../components/results/ResultNotFound";
import { ResultMarksheet, ResultCard } from "../../components/results/ResultMarksheet";
import { SkeletonLoader, EmptyState } from "../../components/common/EmptyState";

export const ResultsPage = () => {
  const { showError, showSuccess } = useToast();

  /**
   * Flow Steps for Search Tab:
   * 'landing'         -> Initial view with prominent School vs University cards
   * 'board_selection' -> "Which Board are you from?" selection
   * 'search_form'     -> Dynamic board-specific form
   * 'loading'         -> Simulated searching state
   * 'result'          -> Official marksheet display
   * 'not_found'       -> Result not found error state
   */
  const [flowStep, setFlowStep] = useState("landing");

  // Selection & Form State (Preserved across back/forward navigation)
  const [resultType, setResultType] = useState("school"); // 'school' | 'university'
  const [boards, setBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [currentBoardConfig, setCurrentBoardConfig] = useState(null);
  const [savedFormValues, setSavedFormValues] = useState({});
  const [lastSearchedRoll, setLastSearchedRoll] = useState("");

  // Result & History State
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [myResults, setMyResults] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Load boards when resultType changes
  useEffect(() => {
    const loadBoards = async () => {
      try {
        const data = await resultService.getBoards(resultType);
        setBoards(data);
      } catch (err) {
        console.error("Error loading boards:", err);
      }
    };
    loadBoards();
  }, [resultType]);

  // Load board configuration when board is selected
  useEffect(() => {
    if (!selectedBoardId) {
      setCurrentBoardConfig(null);
      return;
    }

    const loadConfig = async () => {
      const config = await resultService.getBoardConfig(selectedBoardId, resultType);
      setCurrentBoardConfig(config);
    };
    loadConfig();
  }, [selectedBoardId, resultType]);

  // Load student history on mount
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

  /**
   * Handlers for Flow Transitions
   */

  // 1. Landing: User clicks "Check Result" on School or University card
  const handleSelectResultTypeFromLanding = (type) => {
    setResultType(type);
    setSelectedBoardId(null);
    setCurrentBoardConfig(null);
    setFlowStep("board_selection");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Switch type from top tabs while in the search flow
  const handleSwitchResultType = (type) => {
    setResultType(type);
    setSelectedBoardId(null);
    setCurrentBoardConfig(null);
    setFlowStep("board_selection");
  };

  // 2. Board Selection: User selects a board card
  const handleSelectBoard = (boardId) => {
    setSelectedBoardId(boardId);
    setFlowStep("search_form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 3. Dynamic Form: User submits search
  const handleSearchSubmit = async (formPayload) => {
    setSavedFormValues(formPayload);
    setLastSearchedRoll(formPayload.rollNumber || "");
    setFlowStep("loading");
    setSearchError(null);

    try {
      const result = await resultService.searchResult(formPayload);
      setSearchResult(result);
      setFlowStep("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.warn("Search caught error:", err);
      setSearchError(err.message);
      setFlowStep("not_found");
    }
  };

  // 4. View historical result
  const handleViewHistoricalResult = async (item) => {
    setActiveTab("search");
    setFlowStep("loading");
    try {
      const result = await resultService.searchResult({
        boardId: item.board,
        rollNumber: item.rollNumber,
        type: item.type || "school"
      });
      setSearchResult(result);
      setFlowStep("result");
    } catch (err) {
      showError(err.message || "Result not found");
      setFlowStep("landing");
    }
  };

  // 5. Back Navigation Logic (Preserves state step-by-step)
  const handleGoBack = () => {
    if (flowStep === "result" || flowStep === "not_found") {
      setFlowStep("search_form");
    } else if (flowStep === "search_form") {
      setFlowStep("board_selection");
    } else if (flowStep === "board_selection") {
      setFlowStep("landing");
      setSelectedBoardId(null);
    }
  };

  const handleResetToLanding = () => {
    setFlowStep("landing");
    setSelectedBoardId(null);
    setSearchResult(null);
    setSearchError(null);
  };

  return (
    <div className="space-y-3 max-w-3xl w-full mx-auto box-border">
      {/* 1. Page Header (Hidden on print) */}
      <div className="no-print space-y-1">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-[#0A1D3F] tracking-tight">
                Examination Results
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60">
                2026 Live
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Check Board and University examination marksheets online.
            </p>
          </div>

          {flowStep !== "landing" && (
            <button
              type="button"
              onClick={handleGoBack}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200/80 bg-white text-xs font-bold text-slate-700 hover:text-[#FF8A00] hover:bg-slate-50 transition active:scale-95 shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#FF8A00]" />
              <span>Back</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Search & Results Flow Area */}
      <div className="space-y-3">
        {/* STEP 0: LANDING SCREEN */}
        {flowStep === "landing" && (
          <div className="space-y-2">
            <ResultTypeSelector
              selectedType={null}
              onSelectType={handleSelectResultTypeFromLanding}
              mode="cards"
            />
          </div>
        )}

        {/* STEP 1: BOARD SELECTION */}
        {flowStep === "board_selection" && (
          <div className="space-y-3">
            {/* Type Switcher Tabs at top */}
            <ResultTypeSelector
              selectedType={resultType}
              onSelectType={handleSwitchResultType}
              mode="tabs"
            />

            {/* Board Selector */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 sm:p-5 shadow-xs">
              <BoardSelector
                boards={boards}
                selectedBoardId={selectedBoardId}
                onSelectBoard={handleSelectBoard}
                resultType={resultType}
              />
            </div>
          </div>
        )}

        {/* STEP 2: DYNAMIC BOARD FORM */}
        {flowStep === "search_form" && currentBoardConfig && (
          <div className="space-y-3">
            {/* Type Switcher Tabs */}
            <ResultTypeSelector
              selectedType={resultType}
              onSelectType={handleSwitchResultType}
              mode="tabs"
            />

            {/* Dynamic Form for Selected Board */}
            <ResultSearchForm
              boardConfig={currentBoardConfig}
              resultType={resultType}
              initialValues={savedFormValues}
              onSubmit={handleSearchSubmit}
              loading={false}
              onChangeBoard={() => setFlowStep("board_selection")}
            />
          </div>
        )}

        {/* STEP 3: LOADING STATE */}
        {flowStep === "loading" && (
          <div className="py-4">
            <ResultLoading boardName={currentBoardConfig?.name || "Examination Board"} />
          </div>
        )}

        {/* STEP 4: RESULT DISPLAY */}
        {flowStep === "result" && searchResult && (
          <ResultMarksheet
            result={searchResult}
            onBack={() => setFlowStep("search_form")}
            onNewSearch={handleResetToLanding}
          />
        )}

        {/* STEP 5: ERROR / NOT FOUND STATE */}
        {flowStep === "not_found" && (
          <div className="py-2">
            <ResultNotFound
              title="No Result Found"
              message={searchError || "We couldn't find a result matching the information provided. Please check your details and try again."}
              searchedRoll={lastSearchedRoll}
              onTryAgain={() => setFlowStep("search_form")}
              onReset={handleResetToLanding}
            />
          </div>
        )}
      </div>
    </div>
  );
};
