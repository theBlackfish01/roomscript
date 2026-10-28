/** Pure helper: rejected requests must not release a batch while siblings run. */
export async function settleProbeBatch(tasks: Array<() => Promise<unknown>>): Promise<void> {
  const outcomes = await Promise.all(tasks.map(async task => {
    try { await task(); return {ok: true, error: undefined}; }
    catch (error) {return {ok: false, error};}
  }));
  const failure = outcomes.find(result => !result.ok);
  if (failure) throw failure.error;
}
