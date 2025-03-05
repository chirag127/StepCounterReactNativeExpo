import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Button, Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pedometer } from "expo-sensors";

interface StepEntry {
  date: string;
  steps: number;
}

export default function StepCounter() {
  const [isPedometerAvailable, setIsPedometerAvailable] = useState<boolean | null>(null);
  const [stepCount, setStepCount] = useState<number>(0);
  const [stepHistory, setStepHistory] = useState<StepEntry[]>([]);

  useEffect(() => {
    let subscription: { remove: () => void } | undefined;

    const loadStepHistory = async () => {
      try {
        const storedSteps = await AsyncStorage.getItem("stepHistory");
        if (storedSteps) {
          setStepHistory(JSON.parse(storedSteps));
          // If on Android, set the current day's steps from history
          if (Platform.OS === 'android') {
            const today = new Date().toISOString().split('T')[0];
            const todayEntry = JSON.parse(storedSteps).find((entry: StepEntry) => entry.date === today);
            if (todayEntry) {
              setStepCount(todayEntry.steps);
            }
          }
        }
      } catch (error) {
        console.log("Error loading step history", error);
      }
    };

    const startPedometerTracking = async () => {
      try {
        const isAvailable = await Pedometer.isAvailableAsync();
        setIsPedometerAvailable(isAvailable);

        if (isAvailable) {
          if (Platform.OS === 'ios') {
            // iOS-specific code for getting initial steps
            const end = new Date();
            const start = new Date();
            start.setHours(0, 0, 0, 0);

            const result = await Pedometer.getStepCountAsync(start, end);
            if (result) {
              setStepCount(result.steps);
              saveSteps(result.steps);
            }
          }

          // Start watching new steps - works on both platforms
          subscription = Pedometer.watchStepCount((result) => {
            if (Platform.OS === 'ios') {
              setStepCount(result.steps);
              saveSteps(result.steps);
            } else {
              // For Android, we increment the steps
              setStepCount((prevSteps) => {
                const newSteps = prevSteps + 1;
                saveSteps(newSteps);
                return newSteps;
              });
            }
          });
        }
      } catch (error) {
        console.log("Error setting up pedometer", error);
        setIsPedometerAvailable(false);
      }
    };

    loadStepHistory();
    startPedometerTracking();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  const saveSteps = async (steps: number) => {
    try {
      const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
      let updatedHistory = [...stepHistory];
      const existingEntry = updatedHistory.find((entry) => entry.date === today);

      if (existingEntry) {
        existingEntry.steps = steps; // Update today's step count
      } else {
        updatedHistory.push({ date: today, steps });
      }

      await AsyncStorage.setItem("stepHistory", JSON.stringify(updatedHistory));
      setStepHistory(updatedHistory);
    } catch (error) {
      console.log("Error saving steps", error);
    }
  };

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem("stepHistory");
      setStepHistory([]);
      Alert.alert("History Cleared", "Step history has been cleared.");
    } catch (error) {
      console.log("Error clearing step history", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Step Counter</Text>
      <Text style={styles.status}>
        Pedometer Available: {isPedometerAvailable ? "Yes" : "No"}
      </Text>
      <Text style={styles.steps}>Steps Today: {stepCount}</Text>

      <Text style={styles.historyTitle}>Step History:</Text>
      {stepHistory.length > 0 ? (
        stepHistory.map((entry, index) => (
          <Text key={index} style={styles.historyEntry}>
            {entry.date}: {entry.steps} steps
          </Text>
        ))
      ) : (
        <Text style={styles.noHistory}>No history available.</Text>
      )}

      <Button title="Clear History" onPress={clearHistory} color="red" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  status: {
    fontSize: 18,
    marginBottom: 10,
  },
  steps: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  historyTitle: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: "bold",
  },
  historyEntry: {
    fontSize: 16,
    marginTop: 5,
  },
  noHistory: {
    fontSize: 16,
    color: "gray",
  },
});
