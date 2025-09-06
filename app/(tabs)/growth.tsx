import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryTheme,
} from "victory-native";
import { growthAPI } from "../../src/utils/api";
import { Colors, Spacing, Typography } from "../../src/utils/theme";

interface GrowthData {
  _id: string;
  portfolioValue: number;
  month: string;
  isInitialValue: boolean;
  userId: string;
}

export default function GrowthScreen() {
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);
  const [netGain, setNetGain] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const screenWidth = Dimensions.get("window").width;

  const loadGrowthData = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        const data = await growthAPI.getPortfolioGrowth(JSON.parse(userId));
        setGrowthData(data);

        // Calculate net gain
        if (data.length >= 2) {
          const initialValue =
            data.find((item) => item.isInitialValue)?.portfolioValue || 0;
          const currentValue = data[data.length - 1].portfolioValue;
          setNetGain(currentValue - initialValue);
        }
      }
    } catch (error) {
      console.error("Error loading growth data:", error);
    }
  };

  useEffect(() => {
    loadGrowthData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGrowthData();
    setRefreshing(false);
  };

  const chartData = growthData
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
    .map((item) => ({
      x: item.month,
      y: item.portfolioValue,
    }));

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Portfolio Growth</Text>
        <Text
          style={[
            styles.netGain,
            { color: netGain >= 0 ? Colors.success : Colors.error },
          ]}
        >
          {netGain >= 0 ? "+" : ""}$
          {netGain.toLocaleString("en-US", { maximumFractionDigits: 2 })}
        </Text>
      </View>

      {growthData.length > 0 ? (
        <>
          <View style={styles.chartContainer}>
            <VictoryChart
              width={screenWidth * 0.9}
              theme={VictoryTheme.material}
              domainPadding={{ x: 20 }}
            >
              <VictoryAxis
                tickFormat={(x) => x}
                style={{
                  tickLabels: { angle: -45, fontSize: 8, padding: 20 },
                }}
              />
              <VictoryAxis
                dependentAxis
                tickFormat={(y) => `$${y}`}
                style={{
                  tickLabels: { fontSize: 8 },
                }}
              />
              <VictoryLine
                data={chartData}
                style={{
                  data: { stroke: Colors.primary },
                }}
              />
            </VictoryChart>
          </View>

          <View style={styles.statsList}>
            <Text style={styles.sectionTitle}>Growth Statistics</Text>
            {growthData.map((item) => (
              <View key={item._id} style={styles.statItem}>
                <Text style={styles.statMonth}>{item.month}</Text>
                <Text style={styles.statValue}>
                  $
                  {item.portfolioValue.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No growth data available yet. Add some assets to start tracking your
            portfolio growth.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.primary,
  },
  title: {
    ...Typography.heading2,
    color: Colors.background,
    marginBottom: Spacing.xs,
  },
  netGain: {
    ...Typography.heading1,
    marginTop: Spacing.sm,
  },
  chartContainer: {
    alignItems: "center",
    padding: Spacing.lg,
    backgroundColor: Colors.background,
  },
  statsList: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.heading3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  statItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statMonth: {
    ...Typography.body,
    color: Colors.text,
  },
  statValue: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: "600",
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.textLight,
    textAlign: "center",
  },
});
