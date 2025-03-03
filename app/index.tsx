import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Pedometer } from "expo-sensors";

export default function StepCounter() {
  const [isPedometerAvailable, setIsPedometerAvailable] = useState<boolean | null>(null);
  const [stepCount, setStepCount] = useState(0);

  useEffect(() => {
    let subscription;

    // Check if pedometer is available
    Pedometer.isAvailableAsync().then(
      (result) => setIsPedometerAvailable(result),
      (error) => console.log("Pedometer not available", error)
    );

    // Subscribe to step count updates
    subscription = Pedometer.watchStepCount((result) => {
      setStepCount(result.steps);
    });

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Step Counter</Text>
      <Text style={styles.status}>
        Pedometer Available: {isPedometerAvailable ? "Yes" : "No"}
      </Text>
      <Text style={styles.steps}>Steps: {stepCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
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
});
