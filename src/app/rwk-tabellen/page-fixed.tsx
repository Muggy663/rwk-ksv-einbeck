// Kopiere den gesamten Inhalt von page.tsx hier hinein und ersetze dann den loadData-Teil

// Hier ist der Teil, der ersetzt werden muss:

const loadData = useCallback(async () => {
  if (!selectedCompetition) {

    setLoadingData(false);
    return;
  }
  
  // Smart Refresh: Prüfe ob Daten frisch genug sind (5 Min)
  const cacheKey = `rwk-data-${selectedCompetition.year}-${selectedCompetition.discipline}`;
  const lastFetch = localStorage.getItem(cacheKey + '-time');
  const cachedData = localStorage.getItem(cacheKey);
  
  // Cache für 2025 Kleinkaliber immer löschen
  if (selectedCompetition.year === 2025 && 
      (selectedCompetition.discipline === 'KK' || selectedCompetition.discipline === 'kk')) {
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(cacheKey + '-time');

  } else if (lastFetch && cachedData && Date.now() - parseInt(lastFetch) < 300000) {
    const parsed = JSON.parse(cachedData);
    setTeamData(parsed.teamData);
    if (activeTab === 'einzelschützen') {
      setAllIndividualDataForDiscipline(parsed.individualData || []);
      setFilteredIndividualData(parsed.individualData || []);
    }
    setLoadingData(false);
    return;
  }
  

  setLoadingData(true); setError(null); 
  setTeamData(null); 
  setAllIndividualDataForDiscipline([]); 
  setFilteredIndividualData([]);
  setTopMaleShooter(null);
  setTopFemaleShooter(null);
  
  try {
    const numRounds = await calculateNumRounds(selectedCompetition.year, selectedCompetition.discipline);
    setCurrentNumRoundsState(numRounds);


    const fetchedTeamData = await fetchCompetitionTeamData(selectedCompetition, numRounds);
    setTeamData(fetchedTeamData);
    
    let allIndividuals: any[] = [];
    
    // Lazy load individual data only when needed (on tab switch)
    if (activeTab === 'einzelschützen') {
      // Spezialfall für 2025 Kleinkaliber
      if (selectedCompetition.year === 2025 && 
          (selectedCompetition.discipline === 'KK' || selectedCompetition.discipline === 'kk')) {

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
      } else {
        // Normale Abfrage für andere Jahre/Disziplinen
        allIndividuals = await fetchIndividualShooterData(selectedCompetition, numRounds, null);
        setAllIndividualDataForDiscipline(allIndividuals);
        
        // Apply league filter if one is selected
        if (selectedIndividualLeagueFilter && selectedIndividualLeagueFilter !== "ALL_LEAGUES_IND_FILTER") {
          const individualsInLeague = await fetchIndividualShooterData(selectedCompetition, numRounds, selectedIndividualLeagueFilter);
          setFilteredIndividualData(individualsInLeague);
        } else {
          setFilteredIndividualData(allIndividuals); // Show all if no league filter
        }
      }

      if (allIndividuals.length > 0) { // Base top shooters on all individuals for the discipline
        const males = allIndividuals.filter(s => s.shooterGender && (s.shooterGender.toLowerCase() === 'male' || s.shooterGender.toLowerCase() === 'm'));
        setTopMaleShooter(males.length > 0 ? males[0] : null);
        
        const females = allIndividuals.filter(s => s.shooterGender && (s.shooterGender.toLowerCase() === 'female' || s.shooterGender.toLowerCase() === 'w'));
        setTopFemaleShooter(females.length > 0 ? females[0] : null);
      }
    }
    
    // Cache speichern (außer für 2025 Kleinkaliber)
    if (!(selectedCompetition.year === 2025 && 
        (selectedCompetition.discipline === 'KK' || selectedCompetition.discipline === 'kk'))) {
      localStorage.setItem(cacheKey, JSON.stringify({
        teamData: fetchedTeamData,
        individualData: allIndividuals
      }));
      localStorage.setItem(cacheKey + '-time', Date.now().toString());
    }
  } catch (err: any) {
    console.error('RWK DEBUG: Failed to load RWK data in loadData:', err);
    toast({ title: "Fehler Datenladen", description: `Fehler beim Laden der Wettkampfdaten: ${err.message}`, variant: "destructive" });
    setError((err as Error).message || 'Unbekannter Fehler beim Laden der Daten.');
  } finally {
    setLoadingData(false);

  }
}, [selectedCompetition, activeTab, selectedIndividualLeagueFilter, calculateNumRounds, fetchCompetitionTeamData, fetchIndividualShooterData, toast]);
