package io.github.baizhitiao.eatwhat;

import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;
import androidx.activity.EdgeToEdge;
import androidx.activity.SystemBarStyle;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;
import java.util.Locale;

/**
 * Draws the web app behind transparent system bars so the page's own top bar and
 * navigation bar colour them. Capacitor only does this on WebView 140+, so the bar
 * sizes are injected as --safe-area-inset-* for older WebViews (SystemBars.insetsHandling = disable).
 */
public class MainActivity extends BridgeActivity {

    private int top, bottom, left, right;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // After super.onCreate: the launch (splash) theme is swapped out there, and touching the
        // decor view earlier would build it with that theme's action bar.
        EdgeToEdge.enable(this, SystemBarStyle.auto(Color.TRANSPARENT, Color.TRANSPARENT), SystemBarStyle.auto(Color.TRANSPARENT, Color.TRANSPARENT));
        applyBarIcons(getResources().getConfiguration());

        View decor = getWindow().getDecorView();
        ViewCompat.setOnApplyWindowInsetsListener(decor, (view, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            boolean keyboard = insets.isVisible(WindowInsetsCompat.Type.ime());
            // The keyboard still resizes the page; the bars themselves are left to CSS.
            view.setPadding(0, 0, 0, keyboard ? insets.getInsets(WindowInsetsCompat.Type.ime()).bottom : 0);
            float density = getResources().getDisplayMetrics().density;
            top = Math.round(bars.top / density);
            bottom = keyboard ? 0 : Math.round(bars.bottom / density);
            left = Math.round(bars.left / density);
            right = Math.round(bars.right / density);
            injectInsets();
            return WindowInsetsCompat.CONSUMED;
        });

        bridge.addWebViewListener(new WebViewListener() {
            @Override
            public void onPageCommitVisible(WebView view, String url) {
                injectInsets();
            }
        });
    }

    // uiMode is in the activity's configChanges, so a dark-mode switch arrives here instead of recreating it.
    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        applyBarIcons(newConfig);
    }

    private void applyBarIcons(Configuration config) {
        boolean night = (config.uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setAppearanceLightStatusBars(!night);
        controller.setAppearanceLightNavigationBars(!night);
    }

    private void injectInsets() {
        if (bridge == null || bridge.getWebView() == null) return;
        String script = String.format(
            Locale.US,
            "(function(s){s.setProperty('--safe-area-inset-top','%dpx');s.setProperty('--safe-area-inset-bottom','%dpx');" +
            "s.setProperty('--safe-area-inset-left','%dpx');s.setProperty('--safe-area-inset-right','%dpx')})(document.documentElement.style)",
            top, bottom, left, right
        );
        bridge.getWebView().post(() -> bridge.getWebView().evaluateJavascript(script, null));
    }
}
