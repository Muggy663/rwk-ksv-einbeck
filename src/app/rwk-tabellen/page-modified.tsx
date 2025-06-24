// Modifizierte loadData-Funktion
const loadData = useCallback(async () => {
  if (!selectedCompetition) {
    console.log("RWK DEBUG: loadData - Aborting, selectedCompetition not ready.");
    setLoadingData(false);
    return;
  }
  
  // Smart Refresh: Prüfe ob Daten frisch genug sind (5 Min)
  const cacheKey = `rwk-data-${selectedCompetition.year}-${selectedCompetition.discipline}`;
  const lastFetch = localStorage.getItem(cacheKey + '-time');
  const cachedData = localStorage.getItem(cacheKey);
  
  if (lastFetch && cachedData && Date.now() - parseInt(lastFetch) < 300000) {
    const parsed = JSON.parse(cachedData);
    setTeamData(parsed.teamData);
    if (activeTab === 'einzelschützen') {
      setAllIndividualDataForDiscipline(parsed.individualData || []);
      setFilteredIndividualData(parsed.individualData || []);
    }
    setLoadingData(false);
    return;
  }
  
  console.log("RWK DEBUG: loadData triggered.", { year: selectedCompetition.year, disc: selectedCompetition.discipline, tab: activeTab, leagueFilter: selectedIndividualLeagueFilter });
  setLoadingData(true); setError(null); 
  setTeamData(null); 
  setAllIndividualDataForDiscipline([]); 
  setFilteredIndividualData([]);
  setTopMaleShooter(null);
  setTopFemaleShooter(null);
  
  try {
    const numRounds = await calculateNumRounds(selectedCompetition.year, selectedCompetition.discipline);
    setCurrentNumRoundsState(numRounds);
    console.log(`RWK DEBUG: loadData - Num rounds for competition set to: ${numRounds}`);

    const fetchedTeamData = await fetchCompetitionTeamData(selectedCompetition, numRounds);
    setTeamData(fetchedTeamData);
    
    let allIndividuals: any[] = [];
    
    // Lazy load individual data only when needed (on tab switch)
    if (activeTab === 'einzelschützen') {
      // Importiere den neuen Service für Einzelschützendaten
      const { loadShooterData } = await import('./loadData');
      
      // Fetch all individuals for the selected discipline (without league filter initially)
      allIndividuals = await loadShooterData(selectedCompetition, numRounds, null);
      setAllIndividualDataForDiscipline(allIndividuals);
      
      // Apply league filter if one is selected
      if (selectedIndividualLeagueFilter && selectedIndividualLeagueFilter !== "ALL_LEAGUES_IND_FILTER") {
          const individualsInLeague = await loadShooterData(selectedCompetition, numRounds, selectedIndividualLeagueFilter);
          setFilteredIndividualData(individualsInLeague);
      } else {
          setFilteredIndividualData(allIndividuals); // Show all if no league filter
      }

      if (allIndividuals.length > 0) { // Base top shooters on all individuals for the discipline
        const males = allIndividuals.filter(s => s.shooterGender && (s.shooterGender.toLowerCase() === 'male' || s.shooterGender.toLowerCase() === 'm'));
        setTopMaleShooter(males.length > 0 ? males[0] : null);
        
        const females = allIndividuals.filter(s => s.shooterGender && (s.shooterGender.toLowerCase() === 'female' || s.shooterGender.toLowerCase() === 'w'));
        setTopFemaleShooter(females.length > 0 ? females[0] : null);
      }
    }
    
    // Cache speichern
    localStorage.setItem(cacheKey, JSON.stringify({
      teamData: fetchedTeamData,
      individualData: allIndividuals
    }));
    localStorage.setItem(cacheKey + '-time', Date.now().toString());
  } catch (err: any) {
    console.error('RWK DEBUG: Failed to load RWK data in loadData:', err);
    toast({ title: "Fehler Datenladen", description: `Fehler beim Laden der Wettkampfdaten: ${err.message}`, variant: "destructive" });
    setError((err as Error).message || 'Unbekannter Fehler beim Laden der Daten.');
  } finally {
    setLoadingData(false);
    console.log("RWK DEBUG: loadData finished.");
  }
}, [selectedCompetition, activeTab, selectedIndividualLeagueFilter, calculateNumRounds, fetchCompetitionTeamData, toast]);