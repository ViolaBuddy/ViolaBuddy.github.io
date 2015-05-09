"""
http://stackoverflow.com/questions/257409/download-image-file-from-the-html-page-source-using-python
"""
import urllib


DOWNLOADED_IMAGE_PATH = "full/"

def download_photo(img_url, filename):
    file_path = "%s%s" % (DOWNLOADED_IMAGE_PATH, filename)
    downloaded_image = file(file_path, "wb")

    image_on_web = urllib.urlopen(img_url)
    while True:
        buf = image_on_web.read(65536)
        if len(buf) == 0:
            break
        downloaded_image.write(buf)
    downloaded_image.close()
    image_on_web.close()

    return file_path




ppl = ["bowser","bowser_jr","captain_falcon","charizard","dark_pit","diddy_kong","donkey_kong","dr_mario","duck_hunt","falco","fox","ganondorf","greninja","ike","jigglypuff","king_dedede","kirby","link","little_mac","lucario","lucas","lucina","luigi","mario","marth","mega_man","meta_knight","mewtwo","mr_game_and_watch","ness","olimar","pac-man","palutena","peach","pikachu","pit","rob","robin","rosalina","samus","sheik","shulk","sonic","toon_link","villager","wario","wii_fit_trainer","yoshi","zelda","zero_suit_samus"]

for p in ppl:
    try:
        download_photo("http://smashbros-miiverse.com/images/char/" + p + ".png", p + ".png")
    except:
        print p