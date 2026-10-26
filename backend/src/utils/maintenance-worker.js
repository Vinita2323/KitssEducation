// The existing interval worker, with explicit drain ownership and safe operational state.
export function createMaintenanceWorker({ tasks, intervalMs, logger, name }) {
  let running, stopping = false, timer;
  const state = { name, running:false, stopping:false, lastStartedAt:null,lastCompletedAt:null,lastFailureAt:null,failures:0 };
  const tick = () => {
    if(stopping) return Promise.resolve();
    if(running) return running;
    state.running=true;state.lastStartedAt=new Date();
    running=(async()=>{
      for(const task of tasks) {
        if(stopping) break;
        try { await task(); }
        catch { state.failures++;state.lastFailureAt=new Date();logger.error({event:'maintenance_failed',worker:name},'Maintenance will retry'); }
      }
    })().finally(()=>{ state.running=false;state.lastCompletedAt=new Date();running=undefined; });
    return running;
  };
  return { tick, state:()=>({...state}), start(){timer=setInterval(tick,intervalMs);timer.unref();}, stop(){stopping=true;state.stopping=true;clearInterval(timer);},async drain(){await running;} };
}
