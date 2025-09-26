import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { growthAPI } from "../../src/utils/localStorageAPI";
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

  const loadGrowthData = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        const data = await growthAPI.getPortfolioGrowth(JSON.parse(userId));
        setGrowthData(data);

        // Calculate net gain
        if (data.length >= 2) {
          const initialValue =
            data.find((item: GrowthData) => item.isInitialValue)
              ?.portfolioValue || 0;
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
            <Text style={styles.chartTitle}>Growth Trend</Text>
            <View style={styles.trendContainer}>
              {growthData
                .sort(
                  (a, b) =>
                    new Date(a.month).getTime() - new Date(b.month).getTime()
                )
                .map((item, index) => {
                  const isLast = index === growthData.length - 1;
                  const trend =
                    index > 0
                      ? item.portfolioValue >
                        growthData[index - 1].portfolioValue
                        ? "up"
                        : item.portfolioValue <
                          growthData[index - 1].portfolioValue
                        ? "down"
                        : "same"
                      : "same";

                  return (
                    <View key={item._id} style={styles.trendItem}>
                      <Text style={styles.trendMonth}>{item.month}</Text>
                      <View style={styles.trendValueContainer}>
                        <Text style={styles.trendValue}>
                          $
                          {item.portfolioValue.toLocaleString("en-US", {
                            maximumFractionDigits: 2,
                          })}
                        </Text>
                        {trend === "up" && (
                          <Text style={styles.trendUp}>↗️</Text>
                        )}
                        {trend === "down" && (
                          <Text style={styles.trendDown}>↘️</Text>
                        )}
                        {trend === "same" && (
                          <Text style={styles.trendSame}>→</Text>
                        )}
                      </View>
                      {!isLast && <View style={styles.trendLine} />}
                    </View>
                  );
                })}
            </View>
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
  chartTitle: {
    ...Typography.heading3,
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  trendContainer: {
    paddingVertical: Spacing.md,
  },
  trendItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    position: "relative",
  },
  trendMonth: {
    ...Typography.bodySmall,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
  },
  trendValueContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  trendValue: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: "600",
  },
  trendUp: {
    fontSize: 16,
    color: Colors.success,
  },
  trendDown: {
    fontSize: 16,
    color: Colors.error,
  },
  trendSame: {
    fontSize: 16,
    color: Colors.textLight,
  },
  trendLine: {
    position: "absolute",
    right: 20,
    top: "50%",
    width: 2,
    height: 30,
    backgroundColor: Colors.border,
  },
});
