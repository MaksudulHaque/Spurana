package app.spurana.app;

import android.animation.ValueAnimator;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.TextView;

/**
 * SPURANA · ChatHeadService — the Soul Bubble.
 * A floating ✦ over every app. Drag; it snaps to an edge. Tap →
 * the chat opens. pulse() makes it swell and burn magenta when
 * her voice or words arrive; calm() settles it when seen.
 */
public class ChatHeadService extends Service {

  public static volatile boolean running = false;
  private static ChatHeadService instance;

  private WindowManager wm;
  private FrameLayout root;      // window-sized container (swell headroom)
  private TextView orb;          // the ✦ itself
  private GradientDrawable bg;
  private WindowManager.LayoutParams lp;
  private ValueAnimator pulseAnim;

  private static final int WIN = 74;   // dp — window box
  private static final int ORB = 56;   // dp — the orb inside

  @Override
  public IBinder onBind(Intent intent) { return null; }

  @Override
  public void onCreate() {
    super.onCreate();
    running = true;
    instance = this;
    startInForeground();
    addBubble();
  }

  private void startInForeground() {
    String chId = "soul_bubble";
    NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      NotificationChannel ch = new NotificationChannel(chId, "Soul Bubble", NotificationManager.IMPORTANCE_MIN);
      ch.setDescription("Keeps her light floating above everything");
      nm.createNotificationChannel(ch);
    }
    Intent open = new Intent(this, MainActivity.class);
    open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
    PendingIntent pi = PendingIntent.getActivity(this, 1, open,
        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

    Notification.Builder b = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
        ? new Notification.Builder(this, chId)
        : new Notification.Builder(this);
    Notification n = b
        .setContentTitle("Soul Bubble")
        .setContentText("Her light floats above everything \u2726")
        .setSmallIcon(R.mipmap.ic_launcher)
        .setContentIntent(pi)
        .setOngoing(true)
        .build();

    if (Build.VERSION.SDK_INT >= 34) {
      startForeground(41, n, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
    } else {
      startForeground(41, n);
    }
  }

  private void addBubble() {
    wm = (WindowManager) getSystemService(WINDOW_SERVICE);

    root = new FrameLayout(this);
    orb = new TextView(this);
    orb.setText("\u2726");
    orb.setTextSize(24);
    orb.setTypeface(Typeface.DEFAULT_BOLD);
    orb.setTextColor(Color.parseColor("#E2C28A"));
    orb.setGravity(Gravity.CENTER);
    bg = new GradientDrawable(
        GradientDrawable.Orientation.TL_BR,
        new int[]{Color.parseColor("#E8009A"), Color.parseColor("#140A1A")});
    bg.setShape(GradientDrawable.OVAL);
    bg.setStroke(dp(2), Color.parseColor("#C9A96E"));
    orb.setBackground(bg);

    FrameLayout.LayoutParams inner = new FrameLayout.LayoutParams(dp(ORB), dp(ORB), Gravity.CENTER);
    root.addView(orb, inner);

    int type = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
        ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        : WindowManager.LayoutParams.TYPE_PHONE;

    lp = new WindowManager.LayoutParams(dp(WIN), dp(WIN), type,
        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
        PixelFormat.TRANSLUCENT);
    lp.gravity = Gravity.TOP | Gravity.START;
    lp.x = 0;
    lp.y = dp(180);

    root.setOnTouchListener(new View.OnTouchListener() {
      private int sx, sy; private float tx, ty; private boolean moved;
      @Override public boolean onTouch(View v, MotionEvent e) {
        switch (e.getAction()) {
          case MotionEvent.ACTION_DOWN:
            sx = lp.x; sy = lp.y; tx = e.getRawX(); ty = e.getRawY(); moved = false;
            return true;
          case MotionEvent.ACTION_MOVE:
            int dx = (int) (e.getRawX() - tx), dy = (int) (e.getRawY() - ty);
            if (Math.abs(dx) > 8 || Math.abs(dy) > 8) moved = true;
            lp.x = sx + dx; lp.y = sy + dy;
            try { wm.updateViewLayout(root, lp); } catch (Exception ex) {}
            return true;
          case MotionEvent.ACTION_UP:
            if (!moved) { calmInternal(); openChat(); }
            else { snapToEdge(); }
            return true;
        }
        return false;
      }
    });

    try { wm.addView(root, lp); } catch (Exception e) { stopSelf(); }
  }

  private void snapToEdge() {
    try {
      int screenW = getResources().getDisplayMetrics().widthPixels;
      lp.x = (lp.x + dp(WIN / 2) < screenW / 2) ? 0 : screenW - dp(WIN);
      wm.updateViewLayout(root, lp);
    } catch (Exception e) {}
  }

  private void openChat() {
    Intent i = new Intent(this, MainActivity.class);
    i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
    i.putExtra("spurana_route", "chat");
    try { startActivity(i); } catch (Exception e) {}
  }

  // ── the heartbeat: she spoke ──
  private void pulseInternal() {
    if (orb == null) return;
    calmInternal();
    bg.setStroke(dp(3), Color.parseColor("#FF00B0"));
    orb.setTextColor(Color.WHITE);
    pulseAnim = ValueAnimator.ofFloat(1f, 1.24f);
    pulseAnim.setDuration(560);
    pulseAnim.setRepeatMode(ValueAnimator.REVERSE);
    pulseAnim.setRepeatCount(ValueAnimator.INFINITE);
    pulseAnim.addUpdateListener(a -> {
      float s = (float) a.getAnimatedValue();
      orb.setScaleX(s); orb.setScaleY(s);
    });
    pulseAnim.start();
  }

  private void calmInternal() {
    try { if (pulseAnim != null) { pulseAnim.cancel(); pulseAnim = null; } } catch (Exception e) {}
    if (orb != null) {
      orb.setScaleX(1f); orb.setScaleY(1f);
      orb.setTextColor(Color.parseColor("#E2C28A"));
      bg.setStroke(dp(2), Color.parseColor("#C9A96E"));
    }
  }

  public static void pulse() {
    final ChatHeadService s = instance;
    if (s == null) return;
    new Handler(Looper.getMainLooper()).post(s::pulseInternal);
  }

  public static void calm() {
    final ChatHeadService s = instance;
    if (s == null) return;
    new Handler(Looper.getMainLooper()).post(s::calmInternal);
  }

  private int dp(int v) {
    return (int) (v * getResources().getDisplayMetrics().density + 0.5f);
  }

  @Override
  public void onDestroy() {
    running = false;
    instance = null;
    try { if (pulseAnim != null) pulseAnim.cancel(); } catch (Exception e) {}
    try { if (wm != null && root != null) wm.removeView(root); } catch (Exception e) {}
    super.onDestroy();
  }
}
