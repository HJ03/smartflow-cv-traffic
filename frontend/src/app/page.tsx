"use client";

import React, { useState, useEffect } from "react";
import { Camera, Zap, RefreshCw, Layers, Clock, Video } from "lucide-react";

export default function Dashboard() {
  const [activeFeed, setActiveFeed] = useState(true);
  const [selectedFeed, setSelectedFeed] = useState("1");
  const [allocatedTime, setAllocatedTime] = useState(10);
  const [countdown, setCountdown] = useState(10);

  // Poll the API to fetch the dynamic calculated timer window for the active tab
  useEffect(() => {
    if (!activeFeed) return;

    const fetchTelemetry = async () => {
      try {
        // const res = await fetch(`http://localhost:8000/api/telemetry/${selectedFeed}`);
        const res = await fetch(`https://sf-cv-trfc-backend.onrender.com/api/telemetry/${selectedFeed}`);
        const data = await res.json();
        setAllocatedTime(data.signal_time);
      } catch (err) {
        console.error("Failed to sync telemetry", err);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000); // Check vehicle load variations every 3s
    return () => clearInterval(interval);
  }, [selectedFeed, activeFeed]);

  // Handle local UI countdown ticking mechanics
  useEffect(() => {
    setCountdown(allocatedTime);
  }, [allocatedTime]);

  useEffect(() => {
    if (!activeFeed || countdown <= 0) {
      if (countdown <= 0) setCountdown(allocatedTime);
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, activeFeed, allocatedTime]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 selection:bg-emerald-500/30">
      {/* Global Navbar */}
      <nav className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-5 mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 text-slate-950 p-2.5 rounded-xl shadow-lg">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">SmartFlow Control Matrix</h1>
            <p className="text-xs text-slate-400">Dynamic Multi-Intersection Processing Dashboard</p>
          </div>
        </div>

        <button 
          onClick={() => setActiveFeed(!activeFeed)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all border ${
            activeFeed 
              ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20" 
              : "bg-emerald-500 text-slate-950 border-emerald-400 hover:bg-emerald-400 font-bold"
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${activeFeed ? "animate-spin" : ""}`} />
          {activeFeed ? "Disconnect Stream" : "Mount Pipeline Stream"}
        </button>
      </nav>

      {/* Feed Switching Tabs */}
      <div className="flex gap-2 mb-6 bg-slate-900 p-1.5 rounded-xl border border-slate-800 w-fit">
        <button
          onClick={() => setSelectedFeed("1")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedFeed === "1" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
          }`}
        >
          <Video className="w-4 h-4" /> Camera Feed 01
        </button>
        <button
          onClick={() => setSelectedFeed("2")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedFeed === "2" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
          }`}
        >
          <Video className="w-4 h-4" /> Camera Feed 02
        </button>
      </div>

      {/* Primary Interface Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Interactive Live Camera Viewport */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-5 py-4 bg-slate-900/40 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <Camera className="w-4 h-4 text-emerald-400" />
              Node Feed #{selectedFeed} — Real-time Object Parsing
            </div>
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeFeed ? "bg-emerald-400" : "bg-rose-400"}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${activeFeed ? "bg-emerald-500" : "bg-rose-500"}`}></span>
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                {activeFeed ? "Active Engine" : "Offline"}
              </span>
            </div>
          </div>

          <div className="bg-slate-950 aspect-video flex items-center justify-center relative">
            {activeFeed ? (
              <img 
                key={selectedFeed} // Force re-render element when feed ID key changes
                // src={`http://localhost:8000/api/stream/${selectedFeed}`}
                src={`https://sf-cv-trfc-backend.onrender.com/api/stream/${selectedFeed}`} 
                alt="Active Processing Stream Pipeline Feed" 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center p-8 max-w-sm">
                <Camera className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-400 mb-1">Pipeline Stream Unmounted</h4>
              </div>
            )}
          </div>
        </div>

        {/* Right: Telemetry & ALLOCATED TIMER DISPLAY TAB */}
        <div className="space-y-6">
          {/* Realtime Countdown UI Component */}
          <div className="bg-slate-900 border-2 border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-5 -mt-5" />
            
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-emerald-400" /> Current Signal allocation
            </h3>

            <div className="text-center py-6 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-6xl font-black font-mono tracking-tight text-emerald-400 animate-pulse">
                {activeFeed ? `${countdown}s` : "--"}
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-2 uppercase tracking-widest">
                Remaining Green Phase Window
              </p>
            </div>

            <div className="mt-4 flex justify-between text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800/50">
              <span>Dynamic Max Allocated:</span>
              <span className="font-bold font-mono text-white">{activeFeed ? `${allocatedTime}s` : "N/A"}</span>
            </div>
          </div>

          {/* Boundaries Meta Context Info */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-emerald-400" /> Threshold Parameters
            </h3>
            <div className="space-y-3">
              <div className="bg-slate-950 border border-slate-800/60 p-3.5 rounded-xl text-xs font-mono flex justify-between">
                <span className="text-slate-400">Zone 1 (High Congestion):</span>
                <span className="text-emerald-400 font-bold">60s Max</span>
              </div>
              <div className="bg-slate-950 border border-slate-800/60 p-3.5 rounded-xl text-xs font-mono flex justify-between">
                <span className="text-slate-400">Zone 4 (Baseline Clear):</span>
                <span className="text-emerald-400 font-bold">10s Min</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}