
def api_running_banners(request):
    banners = RunningBanner.objects.filter(enabled=True).order_by('-id').values_list("text", flat=True)
    return JsonResponse({"banners": list(banners)})
