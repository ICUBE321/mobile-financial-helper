import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Asset } from "../../src/types/asset";
import { assetAPI, growthAPI } from "../../src/utils/localStorageAPI";
import { Colors, Spacing, Typography } from "../../src/utils/theme";

export default function OverviewScreen() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadAssets = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        const data = await assetAPI.getAllAssets(JSON.parse(userId));
        setAssets(data);
        // Calculate total value
        const total = data.reduce(
          (sum: number, asset: Asset) => sum + asset.value,
          0
        );
        setTotalValue(total);

        // Auto-calculate and save growth data
        await growthAPI.calculateAndSaveGrowth(JSON.parse(userId));
      }
    } catch (error) {
      console.error("Error loading assets:", error);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAssets();
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
        <Text style={styles.title}>Portfolio Overview</Text>
        <Text style={styles.totalValue}>
          ${totalValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}
        </Text>
        <Text style={styles.currencyNote}>Mixed currencies aggregated</Text>
      </View>

      {assets.length > 0 ? (
        <>
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Portfolio Breakdown</Text>
            {assets.map((asset, index) => {
              const percentage = ((asset.value / totalValue) * 100).toFixed(1);
              return (
                <View key={asset._id || index} style={styles.chartItem}>
                  <View style={styles.chartItemInfo}>
                    <Text style={styles.chartItemName}>{asset.name}</Text>
                    <Text style={styles.chartItemPercentage}>
                      {percentage}%
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${percentage}%` as any },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.assetList}>
            <Text style={styles.sectionTitle}>Asset Breakdown</Text>
            {assets.map((asset, index) => (
              <View key={asset._id || index} style={styles.assetItem}>
                <Text style={styles.assetName}>{asset.name}</Text>
                <Text style={styles.assetValue}>
                  $
                  {asset.value.toLocaleString("en-US", {
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
            No assets yet. Add your first asset to see your portfolio breakdown.
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
  totalValue: {
    ...Typography.heading1,
    color: Colors.background,
  },
  currencyNote: {
    fontSize: 12,
    color: Colors.background,
    opacity: 0.8,
    marginTop: 2,
  },
  chartContainer: {
    alignItems: "center",
    padding: Spacing.lg,
  },
  assetList: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.heading3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  assetItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  assetName: {
    ...Typography.body,
    color: Colors.text,
  },
  assetValue: {
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
  chartItem: {
    marginBottom: Spacing.md,
  },
  chartItemInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  chartItemName: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: "600",
  },
  chartItemPercentage: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: "600",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
});
