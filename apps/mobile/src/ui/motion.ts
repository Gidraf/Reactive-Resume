// Reduced motion, haptics and the tablet check shared by the primitives (tokens.md §6).
import * as Haptics from "expo-haptics";
import { useEffect, useState, useSyncExternalStore } from "react";
import { AccessibilityInfo, useWindowDimensions } from "react-native";
import { Easing, FadeInDown, FadeOut, LinearTransition, ReduceMotion } from "react-native-reanimated";
import { motion, size } from "./tokens";

let reduceMotion = false;
const listeners = new Set<() => void>();
const setReduceMotion = (value: boolean) => {
	reduceMotion = value;
	for (const listener of listeners) listener();
};

void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);

/**
 * iOS Reduce Motion or Android "Remove animations". Movement then takes 0 ms and slides become a `d1` cross-fade.
 * Reanimated and the bottom sheet already skip their animations on their own (`ReduceMotion.System`).
 */
export function useReducedMotion(): boolean {
	return useSyncExternalStore(
		(listener) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		() => reduceMotion,
	);
}

const ignore = () => undefined;

/** tokens.md §6 Haptics. Separate from motion: they play with reduced motion on too. */
export const haptics = {
	/** Segmented change, detent change, lifting a row to reorder. */
	selection: () => void Haptics.selectionAsync().catch(ignore),
	/** Long-press to select. */
	light: () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(ignore),
	/** Confirming a destructive action. */
	warning: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(ignore),
	success: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(ignore),
};

/**
 * Tablet layouts (form sheets, tablet toasts): the short side fits a form sheet. Phones in landscape stay phones,
 * and an iPad in a narrow split view falls back to the phone layout.
 */
export function useIsWide(): boolean {
	const { width, height } = useWindowDimensions();
	return Math.min(width, height) >= size.formSheet;
}

// Shared list motion. Reanimated needs its own (worklet) easing, so these repeat the `motion.ease` and `motion.easeMove` curves.
const listEase = Easing.bezier(0.2, 0.8, 0.2, 1);
const listMove = Easing.bezier(0.77, 0, 0.175, 1);
const listStagger = 40;
const listStaggerCap = 8;

/** A row fading in from 8 pt below its place, staggered by its index (capped at 8). Reduced motion: no movement. */
const listEntering = (index: number) =>
	FadeInDown.duration(motion.d2)
		.easing(listEase)
		.withInitialValues({ opacity: 0, transform: [{ translateY: 8 }] })
		.delay(Math.min(index, listStaggerCap) * listStagger)
		.reduceMotion(ReduceMotion.System);

/** A removed row fades out, faster than it came in. */
const listExiting = FadeOut.duration(motion.d1).reduceMotion(ReduceMotion.System);

/** Spread on a row's `Animated.View`: staggers in on the screen's first appearance only, always fades out. */
export const listItemMotion = (index: number, first: boolean) =>
	first ? { entering: listEntering(index), exiting: listExiting } : { exiting: listExiting };

/** Rows sliding into the gap a removed or moved row leaves. */
export const listLayout = LinearTransition.duration(motion.d2).easing(listMove).reduceMotion(ReduceMotion.System);

/**
 * True until shortly after the list first shows data, so rows stagger in once when the screen opens and never again
 * on scroll, refresh or filter changes.
 */
export function useFirstAppearance(ready: boolean): boolean {
	const [first, setFirst] = useState(true);
	useEffect(() => {
		if (!ready || !first) return;
		const timer = setTimeout(() => setFirst(false), 400);
		return () => clearTimeout(timer);
	}, [ready, first]);
	return first;
}
