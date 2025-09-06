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
import { VictoryPie } from "victory-native";
import { Asset } from "../../src/types/asset";
import { assetAPI } from "../../src/utils/api";
import { Colors, Spacing, Typography } from "../../src/utils/theme";

export default function OverviewScreen() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const screenWidth = Dimensions.get("window").width;

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

  const chartData = assets.map((asset) => ({
    x: asset.name,
    y: asset.value,
  }));

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
      </View>

      {assets.length > 0 ? (
        <>
          <View style={styles.chartContainer}>
            <VictoryPie
              data={chartData}
              width={screenWidth * 0.9}
              height={screenWidth * 0.9}
              colorScale="qualitative"
              innerRadius={50}
              labelRadius={70}
              style={{ labels: { fill: Colors.text, fontSize: 12 } }}
            />
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
});
