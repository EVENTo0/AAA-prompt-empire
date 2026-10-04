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
    private LinearLayout remoteTasks;
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

        root.addView(section("Remote tasks"));
        remoteTasks = new LinearLayout(this);
        remoteTasks.setOrientation(LinearLayout.VERTICAL);
        root.addView(remoteTasks);

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
            refresh();
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
                    } else {
                        for (int i = 0; i < list.length(); i++) {
                            JSONObject item = list.optJSONObject(i);
                            if (item != null) projects.addView(projectCard(item));
                        }
                    }
                    refreshRemoteTasks();
                });
            } catch (Exception error) {
                runOnUiThread(() -> status.setText("Connection failed: " + error.getMessage()));
            }
        });
    }

    private void refreshRemoteTasks() {
        remoteTasks.removeAllViews();
        remoteTasks.addView(text("Loading approved tasks…", 12, 0xFF8294A3));
        executor.execute(() -> {
            try {
                String raw = EventoApi.get(
                        endpoint.getText().toString().trim(),
                        token.getText().toString().trim(),
                        "/api/evento/mobile-admin/tasks");
                JSONObject body = new JSONObject(raw);
                JSONArray list = body.optJSONArray("tasks");
                runOnUiThread(() -> {
                    remoteTasks.removeAllViews();
                    if (list == null || list.length() == 0) {
                        remoteTasks.addView(text("No remote tasks.", 12, 0xFF8294A3));
                        return;
                    }
                    for (int i = 0; i < list.length(); i++) {
                        JSONObject row = list.optJSONObject(i);
                        if (row == null) continue;
                        JSONObject task = row.optJSONObject("task");
                        if (task == null) continue;
                        LinearLayout card = new LinearLayout(this);
                        card.setOrientation(LinearLayout.VERTICAL);
                        card.setPadding(dp(12), dp(12), dp(12), dp(12));
                        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(-1, -2);
                        params.setMargins(0, 0, 0, dp(8));
                        card.setLayoutParams(params);
                        card.setBackgroundColor(0xFF0B151E);
                        String state = row.optString("state", "approved");
                        int stateColor = "production-handoff-approved".equals(state)
                                ? 0xFFD6AB63
                                : "preview-accepted".equals(state)
                                ? 0xFF68E4A2
                                : "preview-verified".equals(state)
                                ? 0xFF4FD4FF
                                : "merged-verified".equals(state)
                                ? 0xFF68E4A2
                                : "merged".equals(state)
                                ? 0xFF4FD4FF
                                : "pr-open".equals(state)
                                    ? 0xFFD6AB63
                                    : "local-built".equals(state)
                                        ? 0xFF4FD4FF
                                        : 0xFF68E4A2;
                        card.addView(text(
                                "#" + row.optInt("number", 0) + " · " + task.optString("project_id", ""),
                                15,
                                Color.WHITE));
                        card.addView(text(task.optString("objective", ""), 12, 0xFFB7C4CD));
                        card.addView(text(
                                state + " · " + task.optString("preferred_agent", "auto"),
                                11,
                                stateColor));

                        String evidence = row.optString("evidenceSummary", "");
                        if (!evidence.isEmpty()) {
                            card.addView(text(evidence, 10, 0xFF9FDFF0));
                        }
                        String prUrl = row.optString("prUrl", "");
                        if (!prUrl.isEmpty()) {
                            card.addView(text("Draft PR: " + prUrl, 10, 0xFFD6AB63));
                        }

                        String mergeSummary = row.optString("mergeSummary", "");
                        if (!mergeSummary.isEmpty()) {
                            card.addView(text(mergeSummary, 10, 0xFF68E4A2));
                        }

                        JSONObject postMergeVerification = row.optJSONObject("postMergeVerification");
                        if (postMergeVerification != null) {
                            boolean verified = postMergeVerification.optBoolean("verified", false);
                            String detail = verified
                                    ? "MAIN CI VERIFIED"
                                    : "MAIN CI " + (postMergeVerification.optInt("failed", 0) > 0 ? "FAILED" : "PENDING");
                            card.addView(text(
                                    detail,
                                    11,
                                    verified ? 0xFF68E4A2 : 0xFFFFBF62));
                        }

                        JSONObject previewDeploy = row.optJSONObject("previewDeploy");
                        if (previewDeploy != null) {
                            boolean previewVerified = previewDeploy.optBoolean("verified", false);
                            String previewUrl = previewDeploy.optString("deployment_url", "");
                            String previewDetail = previewVerified
                                    ? "PREVIEW VERIFIED"
                                    : "PREVIEW " + previewDeploy.optString("ready_state", "UNKNOWN");
                            if (!previewUrl.isEmpty()) {
                                previewDetail += " · https://" + previewUrl.replace("https://", "");
                            }
                            card.addView(text(
                                    previewDetail,
                                    11,
                                    previewVerified ? 0xFF68E4A2 : 0xFFFF6F7D));
                        }

                        JSONObject rollbackReadiness = row.optJSONObject("rollbackReadiness");
                        if (rollbackReadiness != null) {
                            boolean rollbackReady = rollbackReadiness.optBoolean("ready", false);
                            JSONArray rollbackBlockers = rollbackReadiness.optJSONArray("blockers");
                            String rollbackDetail = rollbackReadiness.optString(
                                    "status",
                                    rollbackReady ? "ROLLBACK READY" : "ROLLBACK BLOCKED");
                            if (!rollbackReady && rollbackBlockers != null) {
                                rollbackDetail += " · " + rollbackBlockers.toString();
                            }
                            card.addView(text(
                                    rollbackDetail,
                                    11,
                                    rollbackReady ? 0xFF68E4A2 : 0xFFFF6F7D));
                        }

                        JSONObject productionReadiness = row.optJSONObject("productionReadiness");
                        if (productionReadiness != null) {
                            boolean productionReady = productionReadiness.optBoolean("ready", false);
                            JSONArray productionBlockers = productionReadiness.optJSONArray("blockers");
                            String productionDetail = productionReadiness.optString(
                                    "status",
                                    productionReady ? "READY FOR PRODUCTION HANDOFF" : "PRODUCTION BLOCKED");
                            if (!productionReady && productionBlockers != null) {
                                productionDetail += " · " + productionBlockers.toString();
                            }
                            card.addView(text(
                                    productionDetail,
                                    11,
                                    productionReady ? 0xFF68E4A2 : 0xFFFF6F7D));
                        }

                        JSONObject deployReadiness = row.optJSONObject("deployReadiness");
                        if (deployReadiness != null) {
                            boolean deployReady = deployReadiness.optBoolean("ready", false);
                            JSONArray deployBlockers = deployReadiness.optJSONArray("blockers");
                            String deployDetail = deployReadiness.optString(
                                    "status",
                                    deployReady ? "READY FOR PREVIEW DEPLOY" : "NOT DEPLOYABLE");
                            if (!deployReady && deployBlockers != null) {
                                deployDetail += " · " + deployBlockers.toString();
                            }
                            card.addView(text(
                                    deployDetail,
                                    11,
                                    deployReady ? 0xFF68E4A2 : 0xFFFF6F7D));
                        }

                        JSONObject mergeReadiness = row.optJSONObject("mergeReadiness");
                        if (mergeReadiness != null) {
                            boolean ready = mergeReadiness.optBoolean("ready", false);
                            JSONArray blockers = mergeReadiness.optJSONArray("blockers");
                            String detail = ready
                                    ? "READY TO MERGE"
                                    : "BLOCKED" + (blockers != null ? " · " + blockers.toString() : "");
                            card.addView(text(
                                    detail,
                                    11,
                                    ready ? 0xFF68E4A2 : 0xFFFF6F7D));
                        }

                        int issueNumber = row.optInt("number", 0);
                        if ("local-built".equals(state) || "pr-open".equals(state) || "merge-handoff-approved".equals(state) || "preview-verified".equals(state) || "preview-accepted".equals(state)) {
                            card.addView(button("REQUEST REVISION", v -> taskDecision(issueNumber, "request-revision")));
                        }
                        if ("pr-open".equals(state)) {
                            card.addView(button("APPROVE MERGE HANDOFF", v -> taskDecision(issueNumber, "approve-merge-handoff")));
                        }
                        if ("preview-verified".equals(state)) {
                            card.addView(button("ACCEPT PREVIEW", v -> taskDecision(issueNumber, "accept-preview")));
                        }
                        if ("preview-accepted".equals(state)) {
                            JSONObject production = row.optJSONObject("productionReadiness");
                            if (production != null && production.optBoolean("ready", false)) {
                                card.addView(button("APPROVE PRODUCTION HANDOFF", v -> taskDecision(issueNumber, "approve-production-handoff")));
                            }
                        }
                        remoteTasks.addView(card);
                    }
                });
            } catch (Exception error) {
                runOnUiThread(() -> {
                    remoteTasks.removeAllViews();
                    remoteTasks.addView(text("Task status unavailable: " + error.getMessage(), 12, 0xFFFF6F7D));
                });
            }
        });
    }

    private void taskDecision(int issueNumber, String action) {
        status.setText("Applying " + action + "…");
        executor.execute(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("issueNumber", issueNumber);
                body.put("action", action);
                String result = EventoApi.patch(
                        endpoint.getText().toString().trim(),
                        token.getText().toString().trim(),
                        "/api/evento/mobile-admin/tasks",
                        body);
                JSONObject parsed = new JSONObject(result);
                runOnUiThread(() -> {
                    status.setText("Task #" + issueNumber + " · " + parsed.optString("state", "updated"));
                    refreshRemoteTasks();
                });
            } catch (Exception error) {
                runOnUiThread(() -> status.setText("Decision failed: " + error.getMessage()));
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
        if (!item.optString("repository", "").isEmpty()) {
            String projectId = item.optString("id", "");
            card.addView(button("APPROVE BUILD", v -> approveBuild(projectId)));
        }
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

    private void approveBuild(String projectId) {
        String objective = commandPrompt.getText().toString().trim();
        if (objective.isEmpty()) {
            status.setText("Enter the task objective first.");
            return;
        }
        status.setText("Approving task for " + projectId + "…");
        executor.execute(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("projectId", projectId);
                body.put("objective", objective);
                body.put("mode", "build");
                body.put("preferredAgent", "auto");
                String result = EventoApi.post(
                        endpoint.getText().toString().trim(),
                        token.getText().toString().trim(),
                        "/api/evento/mobile-admin/tasks",
                        body);
                JSONObject parsed = new JSONObject(result);
                runOnUiThread(() -> status.setText(
                        "Approved · GitHub task #" + parsed.optInt("number", 0)));
            } catch (Exception error) {
                runOnUiThread(() -> status.setText("Approval failed: " + error.getMessage()));
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
