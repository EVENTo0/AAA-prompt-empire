package ae.evento.admin;

import android.graphics.Color;
import android.os.Bundle;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class MainActivity extends AppCompatActivity {
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private SecureStore secureStore;
    private EditText endpoint;
    private EditText token;
    private EditText commandPrompt;
    private LinearLayout projects;
    private TextView status;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        secureStore = new SecureStore(this);
        setContentView(buildUi());
        loadSettings();
    }

    private View buildUi() {
        ScrollView scroll = new ScrollView(this);
        scroll.setBackgroundColor(Color.rgb(5, 10, 15));

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(18), dp(28), dp(18), dp(40));
        scroll.addView(root);

        root.addView(text("EVENTO · ADMIN APK", 12, 0xFFD6AB63));
        root.addView(text("Mobile Control Plane", 30, Color.WHITE));
        root.addView(text("Projects, status and safe commands from Android.", 14, 0xFF8294A3));

        endpoint = input("https://your-evento-control-plane.example", false);
        token = input("Mobile admin token", true);
        commandPrompt = input("Continue the highest-value safe next step toward DONE.", false);

        root.addView(section("Connection"));
        root.addView(endpoint);
        root.addView(token);

        LinearLayout connectionActions = row();
        connectionActions.addView(button("Save securely", v -> saveSettings()));
        connectionActions.addView(button("Refresh", v -> refresh()));
        root.addView(connectionActions);

        status = text("Not connected", 13, 0xFF8294A3);
        root.addView(status);

        root.addView(section("Projects"));
        projects = new LinearLayout(this);
        projects.setOrientation(LinearLayout.VERTICAL);
        root.addView(projects);

        root.addView(section("Safe command"));
        root.addView(commandPrompt);
        LinearLayout commands = row();
        commands.addView(button("PLAN", v -> command("plan")));
        commands.addView(button("VERIFY", v -> command("verify")));
        commands.addView(button("PREVIEW", v -> command("preview")));
        root.addView(commands);

        TextView note = text(
                "Desktop-only actions such as Unity, Blender, ADB install and local files remain on EVENTO Desktop. The APK requests control-plane work and never exposes your PC directly.",
                12,
                0xFF8294A3);
        note.setPadding(0, dp(18), 0, 0);
        root.addView(note);

        return scroll;
    }

    private void loadSettings() {
        try {
            endpoint.setText(secureStore.get("endpoint"));
            token.setText(secureStore.get("token"));
        } catch (Exception error) {
            status.setText(error.getMessage());
        }
    }

    private void saveSettings() {
        try {
            String url = endpoint.getText().toString().trim();
            String secret = token.getText().toString().trim();
            if (!url.startsWith("https://")) throw new IllegalArgumentException("HTTPS endpoint required");
            if (secret.length() < 24) throw new IllegalArgumentException("Use a high-entropy admin token");
            secureStore.put("endpoint", url);
            secureStore.put("token", secret);
            status.setText("Saved in Android Keystore");
        } catch (Exception error) {
            status.setText("Save failed: " + error.getMessage());
        }
    }

    private void refresh() {
        projects.removeAllViews();
        status.setText("Loading…");
        executor.execute(() -> {
            try {
                String raw = EventoApi.get(
                        endpoint.getText().toString().trim(),
                        token.getText().toString().trim(),
                        "/api/evento/mobile-admin/overview");
                JSONObject body = new JSONObject(raw);
                JSONArray list = body.optJSONArray("projects");
                runOnUiThread(() -> {
                    status.setText("Connected · " + body.optString("generatedAt", ""));
                    projects.removeAllViews();
                    if (list == null || list.length() == 0) {
                        projects.addView(text("No projects returned.", 13, 0xFF8294A3));
                        return;
                    }
                    for (int i = 0; i < list.length(); i++) {
                        JSONObject item = list.optJSONObject(i);
                        if (item != null) projects.addView(projectCard(item));
                    }
                });
            } catch (Exception error) {
                runOnUiThread(() -> status.setText("Connection failed: " + error.getMessage()));
            }
        });
    }

    private View projectCard(JSONObject item) {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(dp(14), dp(14), dp(14), dp(14));
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(-1, -2);
        params.setMargins(0, 0, 0, dp(10));
        card.setLayoutParams(params);
        card.setBackgroundColor(0xFF0B151E);
        card.addView(text(item.optString("name", item.optString("id", "Project")), 17, Color.WHITE));
        card.addView(text(item.optString("repository", ""), 11, 0xFF8294A3));
        card.addView(text(item.optString("status", "unknown") + " · " + item.optString("priority", ""), 12, 0xFF68E4A2));
        return card;
    }

    private void command(String mode) {
        status.setText("Sending " + mode + "…");
        executor.execute(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("mode", mode);
                body.put("prompt", commandPrompt.getText().toString().trim());
                String result = EventoApi.post(
                        endpoint.getText().toString().trim(),
                        token.getText().toString().trim(),
                        "/api/evento/mobile-admin/command",
                        body);
                JSONObject parsed = new JSONObject(result);
                runOnUiThread(() -> status.setText(parsed.optString("summary", mode + " accepted")));
            } catch (Exception error) {
                runOnUiThread(() -> status.setText("Command failed: " + error.getMessage()));
            }
        });
    }

    private TextView section(String label) {
        TextView view = text(label.toUpperCase(), 12, 0xFFD6AB63);
        view.setPadding(0, dp(24), 0, dp(8));
        return view;
    }

    private TextView text(String value, int sp, int color) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(sp);
        view.setTextColor(color);
        view.setPadding(0, dp(4), 0, dp(4));
        return view;
    }

    private EditText input(String hint, boolean secret) {
        EditText view = new EditText(this);
        view.setHint(hint);
        view.setHintTextColor(0xFF60717F);
        view.setTextColor(Color.WHITE);
        view.setBackgroundColor(0xFF09131C);
        view.setPadding(dp(12), dp(10), dp(12), dp(10));
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(-1, -2);
        params.setMargins(0, 0, 0, dp(8));
        view.setLayoutParams(params);
        if (secret) view.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
        return view;
    }

    private LinearLayout row() {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.START);
        return row;
    }

    private Button button(String label, View.OnClickListener listener) {
        Button button = new Button(this);
        button.setText(label);
        button.setOnClickListener(listener);
        return button;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
