package app.spurana.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * SPURANA · SoulBubble plugin — the JS ↔ native bridge for the
 * floating chat head: overlay permission, service start/stop,
 * and the "which screen did the bubble ask for" handoff.
 */
@CapacitorPlugin(name = "SoulBubble")
public class SoulBubblePlugin extends Plugin {

  @PluginMethod
  public void canDraw(PluginCall call) {
    boolean ok = Build.VERSION.SDK_INT < Build.VERSION_CODES.M
        || Settings.canDrawOverlays(getContext());
    JSObject r = new JSObject();
    r.put("granted", ok);
    call.resolve(r);
  }

  @PluginMethod
  public void requestPermission(PluginCall call) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
        && !Settings.canDrawOverlays(getContext())) {
      Intent i = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
          Uri.parse("package:" + getContext().getPackageName()));
      i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      getContext().startActivity(i);
    }
    call.resolve();
  }

  @PluginMethod
  public void start(PluginCall call) {
    Intent i = new Intent(getContext(), ChatHeadService.class);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      getContext().startForegroundService(i);
    } else {
      getContext().startService(i);
    }
    call.resolve();
  }

  @PluginMethod
  public void stop(PluginCall call) {
    getContext().stopService(new Intent(getContext(), ChatHeadService.class));
    call.resolve();
  }

  @PluginMethod
  public void isRunning(PluginCall call) {
    JSObject r = new JSObject();
    r.put("running", ChatHeadService.running);
    call.resolve(r);
  }

  @PluginMethod
  public void pulse(PluginCall call) {
    ChatHeadService.pulse();
    call.resolve();
  }

  @PluginMethod
  public void calm(PluginCall call) {
    ChatHeadService.calm();
    call.resolve();
  }

  @PluginMethod
  public void getLaunchRoute(PluginCall call) {
    JSObject r = new JSObject();
    String route = null;
    try {
      Intent i = getActivity() != null ? getActivity().getIntent() : null;
      if (i != null) {
        route = i.getStringExtra("spurana_route");
        i.removeExtra("spurana_route"); // consume once
      }
    } catch (Exception e) {}
    r.put("route", route == null ? "" : route);
    call.resolve(r);
  }
}
